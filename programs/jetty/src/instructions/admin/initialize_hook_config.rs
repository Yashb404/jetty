use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::{
            transfer_hook::TransferHook, BaseStateWithExtensions, StateWithExtensions,
        },
        state::Mint as SplMint,
    },
    Mint,
};

use crate::{error::JettyError, state::HookConfig};

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
        init_if_needed,
        payer = payer,
        seeds = [b"policy", mint.key().as_ref()],
        bump,
        space = 8 + HookConfig::INIT_SPACE
    )]
    pub hook_config: Account<'info, HookConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeHookConfig>) -> Result<()> {
    let mint_info = ctx.accounts.mint.to_account_info();
    let mint_data = mint_info.data.borrow();
    let mint_state = StateWithExtensions::<SplMint>::unpack(&mint_data)?;
    let transfer_hook = mint_state.get_extension::<TransferHook>()?;
    let transfer_hook_authority: Option<Pubkey> = transfer_hook.authority.into();

    require!(
        transfer_hook_authority == Some(ctx.accounts.policy_authority.key()),
        JettyError::Unauthorized
    );

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
