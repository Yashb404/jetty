# Jetty (Anchor + Token-2022 Transfer Hook) Security Audit

**Date:** 2026-05-27  
**Scope:** `programs/jetty/src/**` (on-chain) + transfer-hook integration assumptions used by tests/helpers  
**Target:** SPL Token-2022 Transfer Hook pipeline (`spl-transfer-hook-interface` + `spl-tlv-account-resolution`)  

## Executive summary

The on-chain program is relatively small and avoids many common footguns (no `unsafe`, no `unwrap/expect/panic` in handlers, no CPI from the `execute` hot path). The core remaining risks are **interface correctness and strict account validation**, especially:

- Ensuring the `execute` instruction discriminator is **exactly** the SPL Transfer Hook interface discriminator (prefer `#[interface(...)]`).
- Ensuring `execute` verifies that the passed `authority` equals the Token-2022 **source owner** (otherwise policy checks can be bypassed in edge cases where CPI passes an unexpected signer).
- Ensuring `init_extra_account_meta_list` enforces that `token_program` is **Token-2022** (otherwise the extra meta list can be created under wrong assumptions).
- Ensuring the validation PDA (`extra_account_meta_list`) is owned by Jetty and not just “correct seeds”.

Additionally, there is an **optimization / UX** issue: Jetty currently encodes allowlist PDAs in the extra-metas list unconditionally, meaning **every** transfer will attempt to resolve and pass allowlist PDAs (even when allowlist is disabled), increasing CU and creating avoidable failure modes in clients.

## Findings

### 1) **Severity: High** — Missing `authority == source_token_account.owner` check in `execute`

**Vulnerability Description**  
The SPL Transfer Hook interface includes an `authority` account (the source token account authority). Jetty currently requires `authority: Signer`, but it does **not** require that `authority.key() == source_token_account.owner`.  

If the instruction is invoked in a context where a different signer is supplied (client bug, misconstructed CPI, future token-program changes, or malicious attempts combined with partial account spoofing), Jetty’s allowlist logic checks the allowlist PDA against `source_token_account.owner`, but the signer check still may not correctly bind the hook call to the canonical authority semantics. In 2026 standards, transfer hooks should explicitly enforce interface invariants even if “Token-2022 should do it”.

**Location**  
`programs/jetty/src/instructions/execute.rs` — missing check after accounts load in `handler`.  

```18:36:/home/yash/Desktop/Coding/Solana/Capstone/jetty/programs/jetty/src/instructions/execute.rs
pub struct Execute<'info> {
    pub source_token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub destination_token_account: InterfaceAccount<'info, TokenAccount>,
    pub authority: Signer<'info>,
    // ...
}
```

**Remediation Code**

```rust
// programs/jetty/src/instructions/execute.rs
pub fn handler(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Bind interface authority invariant explicitly.
    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.source_token_account.owner,
        JettyError::Unauthorized // or add a dedicated error if you want stricter semantics
    );

    // existing logic continues...
    // transferring flag check, mint check, pause/volume/allowlist checks
    Ok(())
}
```

> If you want a clearer failure mode, add a new error like `InvalidAuthority` (but your current `JettyError` list doesn’t include it).

---

### 2) **Severity: High** — `init_extra_account_meta_list` does not assert `token_program == TOKEN_2022_PROGRAM_ID`

**Vulnerability Description**  
`init_extra_account_meta_list` takes `token_program: Interface<TokenInterface>`, but performs no explicit constraint that it is the **Token-2022 program**.  

While the instruction doesn’t CPI into `token_program` today, omitting this check is a modern integration weakness: it allows callers (or future refactors) to initialize critical validation state under the wrong token-program assumptions, which can later produce confusing failures or be abused by clients that rely on incorrect invariants.

**Location**  
`programs/jetty/src/instructions/init_extra_account_meta_list.rs` — accounts struct / handler.  

```14:38:/home/yash/Desktop/Coding/Solana/Capstone/jetty/programs/jetty/src/instructions/init_extra_account_meta_list.rs
pub struct InitExtraAccountMetaList<'info> {
    // ...
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
```

**Remediation Code**

```rust
use anchor_spl::token_2022::ID as TOKEN_2022_PROGRAM_ID;

pub fn handler(ctx: Context<InitExtraAccountMetaList>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.token_program.key(),
        TOKEN_2022_PROGRAM_ID,
        anchor_lang::error::ErrorCode::InvalidProgramId // or JettyError if you prefer
    );

    // existing authority check + init logic...
    Ok(())
}
```

> If you want Jetty-specific errors only, add a `JettyError::InvalidTokenProgram` and use that instead.

---

### 3) **Severity: Medium** — Validation PDA (`extra_account_meta_list`) lacks explicit owner/data-shape checks

**Vulnerability Description**  
In both `execute` and `init_extra_account_meta_list`, the validation PDA is modeled as `UncheckedAccount` with seed checks. Seed checks ensure the *address* is correct, but they do **not** ensure that:

- the account is **owned by Jetty** (in `execute`), and
- the account’s data is initialized / the right length (in `execute`), and
- the account is **uninitialized** before `create_account` (in init), preventing “already initialized but wrong data” states from silently persisting.

These become relevant as programs evolve: relying on seeds only can allow confusing, harder-to-debug states; in the worst case, incorrect owner/data can cause downstream clients to resolve incorrect extra accounts or fail in ways that bypass expected error surfaces.

**Location**  
`programs/jetty/src/instructions/execute.rs` and `.../init_extra_account_meta_list.rs`.

```24:35:/home/yash/Desktop/Coding/Solana/Capstone/jetty/programs/jetty/src/instructions/execute.rs
pub extra_account_meta_list: UncheckedAccount<'info>,
```

```28:37:/home/yash/Desktop/Coding/Solana/Capstone/jetty/programs/jetty/src/instructions/init_extra_account_meta_list.rs
pub extra_account_meta_list: UncheckedAccount<'info>,
```

**Remediation Code**

Add constraints to the accounts definitions (preferred), plus a defensive runtime check in `init`:

```rust
// execute.rs
#[account(
    seeds = [b"extra-account-metas", mint.key().as_ref()],
    bump,
    constraint = extra_account_meta_list.owner == &crate::ID
)]
pub extra_account_meta_list: UncheckedAccount<'info>;
```

```rust
// init_extra_account_meta_list.rs
#[account(
    mut,
    seeds = [b"extra-account-metas", mint.key().as_ref()],
    bump,
    constraint = extra_account_meta_list.data_is_empty() // prevent re-init surprises
)]
pub extra_account_meta_list: UncheckedAccount<'info>;
```

> If you need to support re-initialization, use a dedicated “realloc + rewrite” flow and keep it authority-gated.

---

### 4) **Severity: Medium** — Transfer Hook interface discriminator robustness (`#[interface]` vs manual bytes)

**Vulnerability Description**  
Jetty currently uses a manual discriminator byte array on the `execute` entrypoint in `lib.rs`:

```30:33:/home/yash/Desktop/Coding/Solana/Capstone/jetty/programs/jetty/src/lib.rs
#[instruction(discriminator = [105, 37, 101, 197, 75, 251, 102, 26])]
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
```

Per the SPL Transfer Hook interface specification, the discriminator is the first 8 bytes of the hash of `"spl-transfer-hook-interface:execute"`. Anchor provides `#[interface(spl_transfer_hook_interface::execute)]` specifically to avoid manual mismatches.

If these bytes are ever wrong (copy/paste error, interface change, crate update, or multi-interface collision), **Token-2022 CPI will fail to invoke Jetty**, effectively disabling enforcement while leaving on-chain config in place (an operational security failure).

**Location**  
`programs/jetty/src/lib.rs` line ~30.

**Remediation Code**

Prefer the interface macro (available since Anchor 0.30 per upstream docs; confirm compatibility with your Anchor 1.0.x line):

```rust
// programs/jetty/src/lib.rs
#[interface(spl_transfer_hook_interface::execute)]
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    instructions::execute::handler(ctx, amount)
}
```

If you must keep a manual discriminator, derive it from the crate constant (pattern used in SPL examples):

```rust
use spl_discriminator::SplDiscriminate;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

#[instruction(discriminator = ExecuteInstruction::SPL_DISCRIMINATOR_SLICE)]
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> { /* ... */ }
```

---

### 5) **Severity: Optimization** — ExtraAccountMetaList always includes allowlist PDAs

**Vulnerability Description**  
`init_extra_account_meta_list` encodes 3 metas: policy PDA + sender allowlist PDA + receiver allowlist PDA (derived via `Seed::AccountData` from token account owner fields). This means **every transfer** will resolve and pass allowlist PDAs even when `hook_config.allowlist_enabled == false`.

While not a direct exploit, this increases CU and expands failure surface (clients must supply/resolve accounts they don’t “need” in most transfers). Under tight CU/size constraints, this becomes a practical availability risk.

**Location**  
`programs/jetty/src/instructions/init_extra_account_meta_list.rs` lines 47–88.

```47:88:/home/yash/Desktop/Coding/Solana/Capstone/jetty/programs/jetty/src/instructions/init_extra_account_meta_list.rs
let account_metas = [
    // policy PDA
    // allowlist PDA for source owner
    // allowlist PDA for destination owner
];
```

**Remediation Code**

Two safe design options:

1) **Always include allowlist metas**, but make client tooling reliably resolve and include them (least on-chain complexity, but always costs CU).
2) **Split validation accounts**: maintain two extra-meta lists per mint:
   - one minimal list (policy-only) used when allowlist disabled,
   - one full list (policy + allowlist) used when allowlist enabled,
   and update the mint’s transfer hook extra accounts accordingly when policy toggles.

Option (2) is best for 2026 CU hygiene but requires more client/admin plumbing.

> If you adopt (2), add **`TODO:`** markers in code for future revisiting, per your project convention.

---

## Issue classes explicitly checked (results)

### Token Extensions & Transfer Hook Security
- **Interface verification:** `execute` uses manual discriminator bytes; recommend migrating to `#[interface(...)]` or crate constant to eliminate mismatch risk.
- **Account resolution & validation:** mint match + transferring flag checks are present. Missing explicit `authority == source.owner`. Validation PDA lacks explicit owner/data checks.
- **Infinite loop / reentrancy:** `execute` performs no CPI and only reads token account data + PDAs; reentrancy surface is minimal. The `transferring` guard is correctly enforced.
- **Read-only/mutability:** `execute` accounts are non-`mut`; admin instructions mutate only what they must. `init_extra_account_meta_list` mutates only the meta list PDA and payer lamports.

### Modern Solana vector checks (2026)
- **CU optimization:** Hot path has one `StateWithExtensions::unpack` + one extension read; acceptable. Allowlist metas always being present is a CU/availability concern.
- **Missing signer/owner checks:** Admin authority checks use `require_keys_eq!` correctly; missing `token_program` ID check; missing `authority == source.owner` binding.
- **PDA seed tampering:** HookConfig and AllowlistEntry PDAs are tightly bound to mint and wallet. Allowlist entries additionally validate PDA address via `create_program_address` with stored bump (good).
- **Arithmetic safety:** No risky arithmetic in handlers beyond comparisons/casts. (No unchecked add/sub/mul/div observed in scope.)
- **Close account / rent reclamation:** Allowlist entries and hook config are long-lived by design; no close flows exist. Consider (optional) close instructions for decommissioning mints or pruning allowlist entries to avoid permanent state bloat.

