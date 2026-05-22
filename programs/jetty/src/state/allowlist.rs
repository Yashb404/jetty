use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AllowlistEntry {
    pub mint: Pubkey,
    pub wallet: Pubkey,
    pub active: bool,
    pub bump: u8,
}
