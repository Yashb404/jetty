use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::{
            transfer_hook::TransferHookAccount, BaseStateWithExtensions, StateWithExtensions,
        },
        state::Account as SplTokenAccount,
    },
    Mint, TokenAccount,
};

use crate::{
    error::JettyError,
    state::{AllowlistEntry, HookConfig},
};

#[derive(Accounts)]
pub struct Execute<'info> {
    pub source_token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub destination_token_account: InterfaceAccount<'info, TokenAccount>,
    /// The authority (source owner). Not a signer for CPIs from the token program.
    /// CHECK: We only compare this account's pubkey to the source owner; do not
    /// require it to be a signer because the token program will invoke this
    /// instruction during transfers without the authority flagged as a signer.
    pub authority: UncheckedAccount<'info>,

    /// CHECK: Validation PDA for transfer-hook interface.
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,
}

pub fn handler(ctx: Context<Execute>, amount: u64) -> Result<()> {
    let source_account_info = ctx.accounts.source_token_account.to_account_info();
    let source_data = source_account_info.data.borrow();
    let source_state = StateWithExtensions::<SplTokenAccount>::unpack(&source_data)?;
    let transfer_hook_account = source_state.get_extension::<TransferHookAccount>()?;
    require!(
        bool::from(transfer_hook_account.transferring),
        JettyError::NotTransferring
    );

    let hook_config = &ctx.accounts.hook_config;
    require_keys_eq!(
        ctx.accounts.mint.key(),
        hook_config.mint,
        JettyError::MintMismatch
    );

    // Bind the signer authority to the canonical source owner.
    require_keys_eq!(
        ctx.accounts.source_token_account.owner,
        ctx.accounts.authority.key(),
        JettyError::InvalidAuthority
    );

    // Ensure the extra-account meta list is owned by this program (defensive check).
    let meta_owner = ctx.accounts.extra_account_meta_list.to_account_info().owner;
    require_keys_eq!(*meta_owner, crate::ID, JettyError::InvalidMetaListOwner);

    if hook_config.paused {
        return err!(JettyError::TransferPaused);
    }

    if hook_config.max_transfer_amount > 0 && amount > hook_config.max_transfer_amount {
        return err!(JettyError::ExceedsVolumeLimit);
    }

    // Dynamic cursor for remaining accounts
    let idx: usize = 0;

    if hook_config.allowlist_enabled {
        // Expect the caller (Token-2022) to provide two allowlist PDAs in remaining accounts.

        // Note: We intentionally do NOT perform owner checks on the allowlist PDAs
        // found in `ctx.remaining_accounts` before attempting to parse them.
        // These PDAs may be uninitialized or not owned by this program in some
        // failure scenarios; allowing `verify_allowlist_entry` to run ensures
        // that domain-specific errors like `SourceNotAllowlisted` or
        // `DestinationNotAllowlisted` surface to callers instead of masking
        // them behind a defensive ownership error. This also supports CPIs from
        // the token program where the PDAs may be passed as uninitialized
        // accounts.
        if ctx.remaining_accounts.len() < idx + 2 {
            return Err(error!(JettyError::SourceNotAllowlisted));
        }

        let sender_entry_info = &ctx.remaining_accounts[idx];
        let receiver_entry_info = &ctx.remaining_accounts[idx + 1];
        // idx += 2; // Uncomment when adding more features

        // Verify the PDAs themselves and their stored bump/owner fields.
        verify_allowlist_entry(
            sender_entry_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.source_token_account.key(),
            JettyError::SourceNotAllowlisted,
        )?;
        verify_allowlist_entry(
            receiver_entry_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.destination_token_account.key(),
            JettyError::DestinationNotAllowlisted,
        )?;
    }

    Ok(())
}

fn verify_allowlist_entry<'info>(
    account_info: &'info AccountInfo<'info>,
    mint: &Pubkey,
    token_account: &Pubkey,
    error_code: JettyError,
) -> Result<()> {
    let allowlist_entry =
        Account::<AllowlistEntry>::try_from(account_info).map_err(|_| error!(error_code))?;
    if !allowlist_entry.active {
        return Err(error!(error_code));
    }
    require_keys_eq!(allowlist_entry.mint, *mint, error_code);
    require_keys_eq!(allowlist_entry.token_account, *token_account, error_code);

    let bump_seed = [allowlist_entry.bump];
    let expected_address = Pubkey::create_program_address(
        &[b"allowlist", mint.as_ref(), token_account.as_ref(), &bump_seed],
        &crate::ID,
    )
    .map_err(|_| error!(error_code))?;
    require_keys_eq!(account_info.key(), expected_address, error_code);

    Ok(())
}
