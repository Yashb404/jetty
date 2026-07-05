use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct HookConfig {
    pub mint: Pubkey,
    pub policy_authority: Pubkey,
    pub bump: u8,
    pub paused: bool,
    pub allowlist_enabled: bool,
    pub max_transfer_amount: u64,
    pub vesting_enabled: bool,
    pub min_transfer_amount: u64,
    pub max_holder_bps: u16,
    pub denylist_enabled: bool,

    /// Cooldown is deny-by-default when enabled, unlike other modules, because it requires
    /// mutable state (last_transfer_timestamp) that the hook cannot create itself (no funding payer).
    /// Users MUST have a CooldownEntry initialized before transferring if this is > 0.
    pub cooldown_seconds: u32,

    pub _reserved: [u8; 48],
}
