use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{error::JettyError, state::HookConfig};

#[event]
pub struct PolicyUpdated {
    pub mint: Pubkey,
    pub paused: bool,
    pub allowlist_enabled: bool,
    pub max_transfer_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdatePolicyArgs {
    pub paused: Option<bool>,
    pub allowlist_enabled: Option<bool>,
    pub max_transfer_amount: Option<u64>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub policy_authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,
}

pub fn handler(ctx: Context<UpdatePolicy>, args: UpdatePolicyArgs) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.policy_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    let hook_config = &mut ctx.accounts.hook_config;
    if let Some(paused) = args.paused {
        hook_config.paused = paused;
    }
    if let Some(allowlist_enabled) = args.allowlist_enabled {
        hook_config.allowlist_enabled = allowlist_enabled;
    }
    if let Some(max_transfer_amount) = args.max_transfer_amount {
        hook_config.max_transfer_amount = max_transfer_amount;
    }

    emit!(PolicyUpdated {
        mint: hook_config.mint,
        paused: hook_config.paused,
        allowlist_enabled: hook_config.allowlist_enabled,
        max_transfer_amount: hook_config.max_transfer_amount,
    });

    Ok(())
}
