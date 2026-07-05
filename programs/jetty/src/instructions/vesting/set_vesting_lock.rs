use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    error::JettyError,
    state::{HookConfig, VestingEntry},
};

#[derive(Accounts)]
pub struct SetVestingLock<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub policy_authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: We don't read data, just use the pubkey to derive the PDA
    pub token_account: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + VestingEntry::INIT_SPACE,
        seeds = [b"vesting", mint.key().as_ref(), token_account.key().as_ref()],
        bump
    )]
    pub vesting_entry: Account<'info, VestingEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetVestingLock>, unlock_timestamp: i64) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.policy_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    let vesting_entry = &mut ctx.accounts.vesting_entry;
    vesting_entry.mint = ctx.accounts.mint.key();
    vesting_entry.token_account = ctx.accounts.token_account.key();
    vesting_entry.unlock_timestamp = unlock_timestamp;
    vesting_entry.bump = ctx.bumps.vesting_entry;

    Ok(())
}
