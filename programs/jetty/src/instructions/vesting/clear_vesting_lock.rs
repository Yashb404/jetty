use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    error::JettyError,
    state::{HookConfig, VestingEntry},
};

#[derive(Accounts)]
pub struct ClearVestingLock<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, // receives rent

    pub policy_authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: We don't read data, just use the pubkey to match the PDA
    pub token_account: UncheckedAccount<'info>,

    #[account(
        mut,
        close = payer,
        seeds = [b"vesting", mint.key().as_ref(), token_account.key().as_ref()],
        bump = vesting_entry.bump,
    )]
    pub vesting_entry: Account<'info, VestingEntry>,
}

pub fn handler(ctx: Context<ClearVestingLock>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.policy_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    // The account is automatically closed and rent is transferred to the payer
    // due to the `close = payer` constraint in the macro.

    Ok(())
}
