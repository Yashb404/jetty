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
}

use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
}
