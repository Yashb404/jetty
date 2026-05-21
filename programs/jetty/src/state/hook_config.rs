use anchor_lang::prelude::*;

#[account]
pub struct HookConfig {
	pub mint: Pubkey,
	pub policy_authority: Pubkey,
	pub bump: u8,
	pub paused: bool,
	pub allowlist_enabled: bool,
	pub max_transfer_amount: u64, // 0 == inactive
}

impl HookConfig {
	// size of fields (in bytes) without discriminator
	// Pubkey = 32, u8 = 1, bool = 1, u64 = 8
	pub const INIT_SPACE: usize = 32 + 32 + 1 + 1 + 1 + 8;
}

