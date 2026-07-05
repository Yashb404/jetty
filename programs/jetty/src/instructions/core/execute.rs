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
    state::{AllowlistEntry, CooldownEntry, DenylistEntry, HookConfig, VestingEntry},
};

const IDX_ALLOWLIST_SENDER: usize = 0;
const IDX_ALLOWLIST_RECEIVER: usize = 1;
const IDX_VESTING_SENDER: usize = 2;
const IDX_DENYLIST_SENDER: usize = 3;
const IDX_DENYLIST_RECEIVER: usize = 4;
const IDX_COOLDOWN_SENDER: usize = 5;

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

    if hook_config.min_transfer_amount > 0
        && amount < hook_config.min_transfer_amount
        && amount != 0
    {
        return err!(JettyError::BelowMinimumTransferAmount);
    }

    if hook_config.max_holder_bps > 0 {
        let max_balance = (ctx.accounts.mint.supply as u128)
            .checked_mul(hook_config.max_holder_bps as u128)
            .unwrap()
            .checked_div(10_000)
            .unwrap();

        let resulting_balance = ctx.accounts.destination_token_account.amount as u128;



        if resulting_balance > max_balance {
            return err!(JettyError::ExceedsHolderCap);
        }
    }

    // Ensure we have exactly 9 extra accounts passed via the token program in remaining_accounts.
    // Index 0: Source allowlist entry PDA
    // Index 1: Destination allowlist entry PDA
    // Index 2: Sender Vesting Entry PDA
    // Index 3: Sender Denylist Entry PDA
    // Index 4: Receiver Denylist Entry PDA
    // Index 5: Sender Cooldown Entry PDA
    // Index 6: Sender Protocol Exemption PDA
    // Index 7: Receiver Protocol Exemption PDA
    // Index 8: Sender Volume Tracker PDA

    // Fallback safety check (the Token program should enforce this based on our `ExtraAccountMetaList`)

    if ctx.remaining_accounts.len() < 9 {
        return Err(error!(JettyError::MetaListSizeOverflow));
    }

    if hook_config.allowlist_enabled {
        let sender_entry_info = &ctx.remaining_accounts[IDX_ALLOWLIST_SENDER];
        let receiver_entry_info = &ctx.remaining_accounts[IDX_ALLOWLIST_RECEIVER];

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

    if hook_config.vesting_enabled {
        let sender_vesting_info = &ctx.remaining_accounts[IDX_VESTING_SENDER];

        verify_vesting_entry(
            sender_vesting_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.source_token_account.key(),
        )?;
    }

    if hook_config.denylist_enabled {
        let sender_denylist_info = &ctx.remaining_accounts[IDX_DENYLIST_SENDER];
        let receiver_denylist_info = &ctx.remaining_accounts[IDX_DENYLIST_RECEIVER];

        verify_denylist_entry(
            sender_denylist_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.source_token_account.key(),
            JettyError::SourceDenylisted,
        )?;

        verify_denylist_entry(
            receiver_denylist_info,
            &ctx.accounts.mint.key(),
            &ctx.accounts.destination_token_account.key(),
            JettyError::DestinationDenylisted,
        )?;
    }

    if hook_config.cooldown_seconds != 0 {
        let cooldown_account_info = &ctx.remaining_accounts[IDX_COOLDOWN_SENDER];

        // ONLY enter this block if cooldown is actually enabled for this mint.
        // We use Account::try_from because this PDA is loaded dynamically from remaining_accounts.

        let mut cooldown_entry = match Account::<CooldownEntry>::try_from(cooldown_account_info) {
            Ok(entry) => {
                entry
            }
            Err(e) => {

                return err!(JettyError::CooldownEntryMissing);
            }
        };

        let current_time = Clock::get()?.unix_timestamp;

        // Cooldown expiration check (skip if timestamp is 0 to allow first transfer)
        if cooldown_entry.last_transfer_timestamp != 0
            && current_time
                < cooldown_entry.last_transfer_timestamp + hook_config.cooldown_seconds as i64
        {
            return err!(JettyError::CooldownNotExpired);
        }

        // Mutate the state
        cooldown_entry.last_transfer_timestamp = current_time;

        // State mutation only needs an explicit `.exit(ctx.program_id)?` call because `CooldownEntry`
        // is manually deserialized from `ctx.remaining_accounts` (via dynamic ExtraAccountMetaList resolution),
        // not declared as a named, typed field in a `#[derive(Accounts)]` struct. Anchor's automatic
        // account-state persistence on instruction exit only applies to accounts declared that second way.
        cooldown_entry.exit(ctx.program_id)?;
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
        &[
            b"allowlist",
            mint.as_ref(),
            token_account.as_ref(),
            &bump_seed,
        ],
        &crate::ID,
    )
    .map_err(|_| error!(error_code))?;
    require_keys_eq!(account_info.key(), expected_address, error_code);

    Ok(())
}

fn verify_vesting_entry<'info>(
    account_info: &'info AccountInfo<'info>,
    mint: &Pubkey,
    token_account: &Pubkey,
) -> Result<()> {
    if let Ok(vesting_entry) = Account::<VestingEntry>::try_from(account_info) {
        require_keys_eq!(vesting_entry.mint, *mint, JettyError::TokensLocked);
        require_keys_eq!(
            vesting_entry.token_account,
            *token_account,
            JettyError::TokensLocked
        );

        let bump_seed = [vesting_entry.bump];
        let expected_address = Pubkey::create_program_address(
            &[
                b"vesting",
                mint.as_ref(),
                token_account.as_ref(),
                &bump_seed,
            ],
            &crate::ID,
        )
        .map_err(|_| error!(JettyError::TokensLocked))?;
        require_keys_eq!(
            account_info.key(),
            expected_address,
            JettyError::TokensLocked
        );

        if Clock::get()?.unix_timestamp < vesting_entry.unlock_timestamp {
            return Err(error!(JettyError::TokensLocked));
        }
    }

    Ok(())
}

fn verify_denylist_entry<'info>(
    account_info: &'info AccountInfo<'info>,
    mint: &Pubkey,
    token_account: &Pubkey,
    error_code: JettyError,
) -> Result<()> {
    if let Ok(denylist_entry) = Account::<DenylistEntry>::try_from(account_info) {
        require_keys_eq!(denylist_entry.mint, *mint, error_code);
        require_keys_eq!(denylist_entry.token_account, *token_account, error_code);

        let bump_seed = [denylist_entry.bump];
        let expected_address = Pubkey::create_program_address(
            &[
                b"denylist",
                mint.as_ref(),
                token_account.as_ref(),
                &bump_seed,
            ],
            &crate::ID,
        )
        .map_err(|_| error!(error_code))?;
        require_keys_eq!(account_info.key(), expected_address, error_code);

        if denylist_entry.flagged {
            return Err(error!(error_code));
        }
    }

    Ok(())
}
