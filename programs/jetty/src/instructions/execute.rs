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
    pub authority: Signer<'info>,

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

    if hook_config.paused {
        return err!(JettyError::TransferPaused);
    }

    if hook_config.max_transfer_amount > 0 && amount > hook_config.max_transfer_amount {
        return err!(JettyError::ExceedsVolumeLimit);
    }

    if hook_config.allowlist_enabled {
        let sender_entry_info = ctx
            .remaining_accounts
            .first()
            .ok_or_else(|| error!(JettyError::SourceNotAllowlisted))?;
        let receiver_entry_info = ctx
            .remaining_accounts
            .get(1)
            .ok_or_else(|| error!(JettyError::DestinationNotAllowlisted))?;

        verify_allowlist_entry(
            sender_entry_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.source_token_account.owner,
            JettyError::SourceNotAllowlisted,
        )?;
        verify_allowlist_entry(
            receiver_entry_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.destination_token_account.owner,
            JettyError::DestinationNotAllowlisted,
        )?;
    }

    Ok(())
}

fn verify_allowlist_entry<'info>(
    account_info: &'info AccountInfo<'info>,
    mint: &Pubkey,
    wallet: &Pubkey,
    error_code: JettyError,
) -> Result<()> {
    let allowlist_entry =
        Account::<AllowlistEntry>::try_from(account_info).map_err(|_| error!(error_code))?;
    if !allowlist_entry.active {
        return Err(error!(error_code));
    }
    require_keys_eq!(allowlist_entry.mint, *mint, error_code);
    require_keys_eq!(allowlist_entry.wallet, *wallet, error_code);

    let bump_seed = [allowlist_entry.bump];
    let expected_address = Pubkey::create_program_address(
        &[b"allowlist", mint.as_ref(), wallet.as_ref(), &bump_seed],
        &crate::ID,
    )
    .map_err(|_| error!(error_code))?;
    require_keys_eq!(account_info.key(), expected_address, error_code);

    Ok(())
}
