# Jetty — Handoff Plan

Last updated: 2026-06-14

**Purpose:** concise handoff summarizing current status, completed work, pending productionization tasks, and immediate next steps to stabilize CI and publish the SDK.

**Current Branch / PR:**
- Branch: master (Merged feature/jetty-ts-test-suite via PR #16)
- Active PR: None (all core feature tests, SDK scaffold, and CI actions are merged and passing)

## Smart Contract Status
- **Token-2022 CPI Transfer Settlement**: RESOLVED. The instruction allows CPI calls from the token program during transfers because `programs/jetty/src/instructions/execute.rs` now properly implements `UncheckedAccount<'info>` for the `authority` field (rather than expecting a `Signer`).

## SDK & Package Management
- **Dependency Tracking**: Successfully migrated to Yarn. The workspace and `sdk/` package dependencies are managed via Yarn, with `sdk/yarn.lock` tracking dependencies. References to generating `package-lock.json` via npm are deprecated and removed.

## CI/CD Infrastructure
- **Node.js v20 Upgrade for `sdk-tests`**: COMPLETED. The `sdk-tests` workflow job in `.github/workflows/ci.yml` is successfully configured to run using Node.js version 20.

## Security & High-Priority Backlog
- **Security Audit & CVE Gates**: High-priority open item. While the `security-scan` job is integrated into CI, it still contains `|| true` overrides for the `cargo audit` and `yarn audit` steps. These overrides must be removed to enforce strict failure on critical CVEs once dependency vulnerabilities are resolved.
- **Frontend Dashboard Integration**: Integrate the frontend dashboard (`app/dashboard/index.html`) with the `@jetty/sdk` and a web wallet provider (e.g., Solana Wallet Adapter) to replace mock statuses with live chain data.

## Codebase Architecture & Merged Mechanics

The `feature/jetty-ts-test-suite` branch merged comprehensive implementations across the following layers:

### 1. On-Chain Compliance Program (`programs/jetty`)
- **SPL Token-2022 Transfer Hook Interface**: Implements the native Transfer Hook interface. The `execute` instruction interceptor uses the correct SPL Transfer Hook discriminator (`[105, 37, 101, 197, 75, 251, 102, 26]`) to inspect transfers.
- **Compliance Rules**: Enforces transfer policies inside the `execute` handler:
  - **Global Pause Status**: Instantly halts all token transfers if `paused` is true in `HookConfig`.
  - **Volume Limiting**: Blocks transfers where `amount > max_transfer_amount` (when configured > 0).
  - **Dynamic Allowlist**: If enabled, expects the caller (token program) to pass two allowlist PDA accounts (`AllowlistEntry`) in the remaining accounts list. Both sender and receiver wallets must have `active == true` records on-chain.
- **State PDAs**:
  - `HookConfig`: `["policy", mint_address]` — Stores pause/volume/allowlist switches and policy authority.
  - `AllowlistEntry`: `["allowlist", mint_address, wallet_address]` — Defines whether a specific wallet is allowlisted.
- **Access Control & Safety Checks**:
  - Signer validation: Only the `policy_authority` listed in `HookConfig` can modify compliance states or add/remove allowlist entries.
  - Strict Program Assertions: Verified during PDA initialization (`init_extra_account_meta_list`) that the token program is specifically `TOKEN_2022_PROGRAM_ID`.
  - Validation PDA Owner Binding: Checks that the `extra_account_meta_list` account is owned by the program (`crate::ID`) defensively.
  - Authority binding: Compares `source_token_account.owner` to the hook context `authority` to prevent spoofing/bypass attempts.

### 2. TypeScript SDK (`sdk/`)
- A helper package (`@jetty/sdk`) built to enable seamless third-party client integrations:
  - **Deterministic PDA Derivations**: Exports `deriveHookConfigPda`, `deriveExtraAccountMetaListPda`, and `deriveAllowlistEntryPda`.
  - **Transaction Helpers**: Exports `appendExtraAccounts` to automatically resolve, order, and append the necessary compliance validation PDAs as remaining accounts on a transfer instruction.

### 3. Integration & Unit Tests (`tests/` and `sdk/__tests__`)
- **Test Fixture Setup**: Programmatically creates dynamic Token-2022 mints configured with the transfer-hook extension pointing to the Jetty program.
- **Legacy Signing Fallback**: Standardizes on legacy Transaction serialization and `provider.sendAndConfirm` to bypass client-side base58-length issues seen in modern transaction signing paths.
- **Test Scenarios**: Includes 14 integration test cases covering duplication guardrails, authority authorization gates, transfer limits, paused hooks, allowlist enforcement rules, and successful transfers.

### 4. Admin Dashboard UI Mockup (`app/dashboard/`)
- A single-page static interface built using React and Tailwind CSS loaded via CDN.
- Configures screens for connecting wallets, browsing mint policies, toggle switches for policy updates, and allowlist tables with add/revoke controls.

## Medium-priority / Optional Items
- **On-chain authority rotation**: Implement on-chain `transfer_policy_authority` instruction (if contract-managed authority rotation is desired).
- **Rent reclamation**: Implement `close_on_revoke` for `AllowlistEntry` (reclaim rent when entry is removed) or provide an explicit archive instruction.
- **Upgrade authority multisig**: Prepare scripted steps + documentation to rotate program upgrade authority to a multisig (recommended before production deployment).

## Immediate Next Steps (Exact Commands)

Run locally to check audit warnings, install dependencies, and run verification scans:

```bash
# Clean install of all dependencies via Yarn workspace settings
yarn install --frozen-lockfile

# Check audit warnings locally for Rust dependencies
cargo audit

# Check audit warnings locally for root JS dependencies
yarn audit

# Check audit warnings locally for SDK dependencies
cd sdk
yarn audit
```

CI guidance:
- Update the workflow in `.github/workflows/ci.yml` to remove the `|| true` suffix from audit commands once dependency issues are resolved.
- Integrate a dev server/bundler for the frontend dashboard to support `@jetty/sdk` imports.
