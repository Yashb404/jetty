use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    error::JettyError,
    state::{DenylistEntry, HookConfig},
};

#[derive(Accounts)]
pub struct UpdateDenylist<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub policy_authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump,
        has_one = policy_authority @ JettyError::Unauthorized,
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: The token account to flag. We don't strictly require it to be initialized yet.
    pub token_account: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + DenylistEntry::INIT_SPACE,
        seeds = [b"denylist", mint.key().as_ref(), token_account.key().as_ref()],
        bump
    )]
    pub denylist_entry: Account<'info, DenylistEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateDenylist>, flagged: bool) -> Result<()> {
    let denylist_entry = &mut ctx.accounts.denylist_entry;
    
    // Initialize if it's new
    if denylist_entry.mint == Pubkey::default() {
        denylist_entry.mint = ctx.accounts.mint.key();
        denylist_entry.token_account = ctx.accounts.token_account.key();
        denylist_entry.bump = ctx.bumps.denylist_entry;
    }
    
    denylist_entry.flagged = flagged;
    
    Ok(())
}
