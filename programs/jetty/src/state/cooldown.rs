use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CooldownEntry {
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub last_transfer_timestamp: i64,
    pub bump: u8,
}
