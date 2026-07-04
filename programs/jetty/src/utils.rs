use anchor_lang::prelude::*;
use spl_tlv_account_resolution::{account::ExtraAccountMeta, seeds::Seed};

use crate::state::HookConfig;

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
pub fn build_extra_account_metas(hook_config: &HookConfig) -> Result<Vec<ExtraAccountMeta>> {
    let mut metas: Vec<ExtraAccountMeta> = vec![
        // ── Baseline: hook_config PDA ──────────────────────────────────
        // Seeds: ["policy", mint_key]
        // Index 1 in the Execute instruction layout is the mint account.
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
    ];

    if hook_config.allowlist_enabled {
        // ── Source allowlist entry PDA ──────────────────────────────────
        // Seeds: ["allowlist", mint_key, source_token_account_key]
        // Index 0 = source token account, Index 1 = mint.
        metas.push(
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
        );

        // ── Destination allowlist entry PDA ────────────────────────────
        // Seeds: ["allowlist", mint_key, destination_token_account_key]
        // Index 2 = destination token account.
        metas.push(
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
        );
    }

    // ── Sender Vesting Entry PDA ────────────────────────────────────
    // Seeds: ["vesting", mint_key, source_token_account_key]
    // Index 0 = source token account, Index 1 = mint.
    // Injected unconditionally, checked conditionally inside execute.rs.
    metas.push(
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
    );

    // Safety check: Enforce a hard cap on the number of features (metas) to prevent
    // unbounded growth of the ExtraAccountMetaList PDA and keep the tx size well
    // under Solana's 1232-byte limit.
    if metas.len() > 10 {
        return Err(error!(crate::error::JettyError::MetaListSizeOverflow));
    }

    Ok(metas)
}
