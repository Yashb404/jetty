use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    state::{CooldownEntry, HookConfig},
};

#[derive(Accounts)]
pub struct InitCooldownEntry<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump,
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: The token account to initialize cooldown for.
    pub token_account: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + CooldownEntry::INIT_SPACE,
        seeds = [b"cooldown", mint.key().as_ref(), token_account.key().as_ref()],
        bump
    )]
    pub cooldown_entry: Account<'info, CooldownEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitCooldownEntry>) -> Result<()> {
    let cooldown_entry = &mut ctx.accounts.cooldown_entry;
    cooldown_entry.mint = ctx.accounts.mint.key();
    cooldown_entry.token_account = ctx.accounts.token_account.key();
    cooldown_entry.last_transfer_timestamp = 0;
    cooldown_entry.bump = ctx.bumps.cooldown_entry;

    Ok(())
}
