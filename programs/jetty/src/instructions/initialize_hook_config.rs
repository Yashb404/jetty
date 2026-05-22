use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::state::HookConfig;

#[event]
pub struct HookConfigInitialized {
    pub mint: Pubkey,
    pub policy_authority: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeHookConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub policy_authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = payer,
        seeds = [b"policy", mint.key().as_ref()],
        bump,
        space = 8 + HookConfig::INIT_SPACE
    )]
    pub hook_config: Account<'info, HookConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeHookConfig>) -> Result<()> {
    let hook_config = &mut ctx.accounts.hook_config;
    hook_config.mint = ctx.accounts.mint.key();
    hook_config.policy_authority = ctx.accounts.policy_authority.key();
    hook_config.bump = ctx.bumps.hook_config;
    hook_config.paused = false;
    hook_config.allowlist_enabled = false;
    hook_config.max_transfer_amount = 0;

    emit!(HookConfigInitialized {
        mint: hook_config.mint,
        policy_authority: hook_config.policy_authority,
    });

    Ok(())
}
