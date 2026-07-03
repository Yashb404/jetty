use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{error::JettyError, state::HookConfig};

/// Emitted when the policy authority for a mint is rotated.
#[event]
pub struct PolicyAuthorityAssigned {
    pub mint: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}

#[derive(Accounts)]
pub struct AssignPolicyAuthority<'info> {
    /// The current policy authority. Must sign to authorise the rotation.
    pub current_authority: Signer<'info>,

    /// The incoming policy authority. Must also sign so that we prove the new
    /// key is live and the operator is not accidentally locking the config to
    /// an unreachable address.
    pub new_authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump,
        constraint = hook_config.mint == mint.key() @ JettyError::MintMismatch,
    )]
    pub hook_config: Account<'info, HookConfig>,
}

pub fn handler(ctx: Context<AssignPolicyAuthority>) -> Result<()> {
    // Verify the signer is the current authority stored on-chain.
    require_keys_eq!(
        ctx.accounts.current_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    // Guard against a no-op rotation to the same key; this is almost always a
    // client mistake and would waste compute and emit a misleading event.
    require_keys_neq!(
        ctx.accounts.new_authority.key(),
        ctx.accounts.current_authority.key(),
        JettyError::Unauthorized
    );

    let old_authority = ctx.accounts.hook_config.policy_authority;
    ctx.accounts.hook_config.policy_authority = ctx.accounts.new_authority.key();

    emit!(PolicyAuthorityAssigned {
        mint: ctx.accounts.mint.key(),
        old_authority,
        new_authority: ctx.accounts.new_authority.key(),
    });

    Ok(())
}
