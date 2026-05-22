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

    pub wallet: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        seeds = [b"allowlist", mint.key().as_ref(), wallet.key().as_ref()],
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
    allowlist_entry.wallet = ctx.accounts.wallet.key();
    allowlist_entry.active = active;
    allowlist_entry.bump = ctx.bumps.allowlist_entry;

    Ok(())
}
