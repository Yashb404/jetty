use anchor_lang::prelude::*;
use spl_tlv_account_resolution::{account::ExtraAccountMeta, seeds::Seed};

/// Dynamically builds the `ExtraAccountMeta` vector based on the currently
/// enabled features in the given `HookConfig`.
///
/// The hook_config PDA itself is always included (index 0) as the baseline
/// account required by every transfer — it stores the feature flags checked
/// inside the `execute` handler.
///
/// Additional metas are appended only for features that are actively enabled,
/// keeping the `ExtraAccountMetaList` PDA minimal for users who only need
/// a subset of Jetty's compliance modules.
pub fn build_extra_account_metas() -> Result<Vec<ExtraAccountMeta>> {
    let metas: Vec<ExtraAccountMeta> = vec![
        // 0. Baseline: hook_config PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"policy".to_vec(),
                },
                Seed::AccountKey { index: 1 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 1. Source allowlist entry PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"allowlist".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 0 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 2. Destination allowlist entry PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"allowlist".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 2 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 3. Sender Vesting Entry PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"vesting".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 0 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 4. Sender Denylist Entry PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"denylist".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 0 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 5. Receiver Denylist Entry PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"denylist".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 2 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 6. Sender Cooldown Entry PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"cooldown".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 0 },
            ],
            false,
            true, // is_writable
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 7. Sender Protocol Exemption PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"exemption".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 0 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 8. Receiver Protocol Exemption PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"exemption".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 2 },
            ],
            false,
            false,
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
        // 9. Sender Volume Tracker PDA
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: b"volume".to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 0 },
            ],
            false,
            true, // is_writable
        )
        .map_err(|_| error!(crate::error::JettyError::MetaListSizeOverflow))?,
    ];

    Ok(metas)
}
