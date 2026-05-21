use anchor_lang::prelude::*;

#[account]
pub struct AllowlistEntry {
	pub mint: Pubkey,
	pub wallet: Pubkey,
	pub active: bool,
	pub bump: u8,
}

impl AllowlistEntry {
	pub const INIT_SPACE: usize = 32 + 32 + 1 + 1;
}

