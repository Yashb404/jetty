use anchor_lang::prelude::*;

#[error_code]
pub enum JettyError {
    #[msg("Transfers for this mint are currently paused.")]
    TransferPaused,

    #[msg("Transfer amount exceeds the configured volume limit.")]
    ExceedsVolumeLimit,

    #[msg("Source wallet is not on the allowlist.")]
    SourceNotAllowlisted,

    #[msg("Destination wallet is not on the allowlist.")]
    DestinationNotAllowlisted,

    #[msg("Caller is not the policy authority for this mint.")]
    Unauthorized,

    #[msg("The source token account is not in a transferring state. Direct invocation is not permitted.")]
    NotTransferring,

    #[msg("Mint mismatch between instruction accounts and stored config.")]
    MintMismatch,

    #[msg("The provided token program is not Token-2022.")]
    InvalidTokenProgram,

    #[msg("The extra account meta list is not owned by this program.")]
    InvalidMetaListOwner,

    #[msg("The provided authority does not match the source token account owner.")]
    InvalidAuthority,

    #[msg("The extra account meta list has not been initialized for this mint.")]
    ExtraMetaListNotInitialized,

    #[msg("The computed extra account meta list size exceeds safe bounds.")]
    MetaListSizeOverflow,

    #[msg("Tokens are locked until the vesting period expires.")]
    TokensLocked,

    #[msg("Transfer amount is below the configured minimum transfer amount.")]
    BelowMinimumTransferAmount,

    #[msg("Transfer would exceed the receiver's maximum allowed balance cap.")]
    ExceedsHolderCap,

    #[msg("Basis points must be between 0 and 10000.")]
    InvalidBps,
}
