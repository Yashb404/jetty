use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DenylistEntry {
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub flagged: bool,
    pub bump: u8,
}
