use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    error::JettyError,
    state::{AllowlistEntry, HookConfig},
};

#[derive(Accounts)]
pub struct UpdateAllowlist<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub policy_authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: The token account address is used as the PDA seed.
    /// It does not need to be initialized yet — enabling allowlisting an ATA
    /// atomically in the same transaction as its creation.
    pub token_account: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        seeds = [b"allowlist", mint.key().as_ref(), token_account.key().as_ref()],
        bump,
        space = 8 + AllowlistEntry::INIT_SPACE
    )]
    pub allowlist_entry: Account<'info, AllowlistEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateAllowlist>, active: bool) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.policy_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    let allowlist_entry = &mut ctx.accounts.allowlist_entry;
    allowlist_entry.mint = ctx.accounts.mint.key();
    allowlist_entry.token_account = ctx.accounts.token_account.key();
    allowlist_entry.active = active;
    allowlist_entry.bump = ctx.bumps.allowlist_entry;

    // If the entry is being revoked, close the PDA account to recover rent.
    // Zeroing the data and draining lamports removes the account from the ledger,
    // which also causes verify_allowlist_entry to fail (deserialization error →
    // domain-specific SourceNotAllowlisted / DestinationNotAllowlisted).
    if !active {
        let entry_info = ctx.accounts.allowlist_entry.to_account_info();
        let payer_info = ctx.accounts.payer.to_account_info();

        // Transfer all lamports to payer.
        let lamports = entry_info.lamports();
        let new_payer_balance = payer_info
            .lamports()
            .checked_add(lamports)
            .ok_or(ProgramError::InvalidArgument)?;
        **payer_info.try_borrow_mut_lamports()? = new_payer_balance;
        **entry_info.try_borrow_mut_lamports()? = 0;

        // Zero out account data so the runtime drops ownership.
        let mut data = entry_info.try_borrow_mut_data()?;
        data.fill(0);
    }

    Ok(())
}
