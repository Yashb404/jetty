use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VestingEntry {
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub unlock_timestamp: i64,
    pub bump: u8,
}
