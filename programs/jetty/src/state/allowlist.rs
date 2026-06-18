use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AllowlistEntry {
    pub mint: Pubkey,
    /// The token account address used as the allowlist seed.
    /// This is the ATA (or any Token-2022 account) for the wallet,
    /// NOT the wallet owner pubkey — enabling atomic same-tx ATA initialization.
    pub token_account: Pubkey,
    pub active: bool,
    pub bump: u8,
}
