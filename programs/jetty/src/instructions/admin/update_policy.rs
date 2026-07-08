use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{error::JettyError, state::HookConfig};

#[event]
pub struct PolicyUpdated {
    pub mint: Pubkey,
    pub paused: bool,
    pub allowlist_enabled: bool,
    pub max_transfer_amount: u64,
    pub vesting_enabled: bool,
    pub min_transfer_amount: u64,
    pub max_holder_bps: u16,
    pub denylist_enabled: bool,
    pub cooldown_seconds: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdatePolicyArgs {
    pub paused: Option<bool>,
    pub allowlist_enabled: Option<bool>,
    pub max_transfer_amount: Option<u64>,
    pub vesting_enabled: Option<bool>,
    pub min_transfer_amount: Option<u64>,
    pub max_holder_bps: Option<u16>,
    pub denylist_enabled: Option<bool>,
    pub cooldown_seconds: Option<u32>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    /// The wallet that currently holds policy authority over this mint's hook config.
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
    if let Some(vesting_enabled) = args.vesting_enabled {
        hook_config.vesting_enabled = vesting_enabled;
    }
    if let Some(min_transfer_amount) = args.min_transfer_amount {
        hook_config.min_transfer_amount = min_transfer_amount;
    }
    if let Some(max_holder_bps) = args.max_holder_bps {
        require!(max_holder_bps <= 10000, JettyError::InvalidBps);
        hook_config.max_holder_bps = max_holder_bps;
    }
    if let Some(denylist_enabled) = args.denylist_enabled {
        hook_config.denylist_enabled = denylist_enabled;
    }
    if let Some(cooldown_seconds) = args.cooldown_seconds {
        // Cap at 30 days (2_592_000 s). u32::MAX (~136 years) would permanently
        // freeze every wallet after its first transfer — treat it as a footgun.
        require!(
            cooldown_seconds <= 2_592_000,
            JettyError::CooldownTooLong
        );
        hook_config.cooldown_seconds = cooldown_seconds;
    }

    if hook_config.min_transfer_amount > 0 && hook_config.max_transfer_amount > 0 {
        require!(
            hook_config.min_transfer_amount <= hook_config.max_transfer_amount,
            JettyError::InvalidTransferBounds
        );
    }

    emit!(PolicyUpdated {
        mint: hook_config.mint,
        paused: hook_config.paused,
        allowlist_enabled: hook_config.allowlist_enabled,
        max_transfer_amount: hook_config.max_transfer_amount,
        vesting_enabled: hook_config.vesting_enabled,
        min_transfer_amount: hook_config.min_transfer_amount,
        max_holder_bps: hook_config.max_holder_bps,
        denylist_enabled: hook_config.denylist_enabled,
        cooldown_seconds: hook_config.cooldown_seconds,
    });

    Ok(())
}
