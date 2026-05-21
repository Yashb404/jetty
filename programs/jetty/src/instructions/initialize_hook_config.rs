use anchor_lang::prelude::*;
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

	/// CHECK: Token-2022 mint interface (read-only)
	pub mint: AccountInfo<'info>,

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
	let bump = *ctx.bumps.get("hook_config").ok_or(JettyError::Unauthorized)?;

	let hook = &mut ctx.accounts.hook_config;
	hook.mint = ctx.accounts.mint.key();
	hook.policy_authority = ctx.accounts.policy_authority.key();
	hook.bump = bump;
	hook.paused = false;
	hook.allowlist_enabled = false;
	hook.max_transfer_amount = 0;

	emit!(HookConfigInitialized {
		mint: hook.mint,
		policy_authority: hook.policy_authority,
	});

	Ok(())
}

