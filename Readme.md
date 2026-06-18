# Jetty

> Universal on-chain compliance layer for SPL Token-2022 Transfer Hooks on Solana.

Token issuers point their mint's Transfer Hook at the Jetty program ID and configure modular compliance policies — no custom Rust required.

---

## Overview

Every SPL Token-2022 transfer is atomically intercepted by Jetty and evaluated against the issuer's active policy:

Three policy modules are available, each independently toggleable per mint:

| Module | What it does |
|---|---|
| **Global Pause** | Rejects all transfers when active |
| **Volume Limit** | Rejects transfers exceeding a configured `u64` threshold |
| **Allowlist** | Rejects transfers where sender or receiver lacks a valid on-chain allowlist entry |

One deployed program. Many mints. Each issuer owns and controls their own policy PDA — isolated by design.

---

## Project structure

```
programs/jetty/src/
├── lib.rs
├── error.rs
├── instructions/
│   ├── initialize_hook_config.rs       # Create policy PDA for a mint
│   ├── init_extra_account_meta_list.rs # Register extra accounts with Token-2022
│   ├── execute.rs                      # Core hook — invoked on every transfer
│   ├── update_policy.rs                # Pause, volume limit, allowlist toggle
│   ├── update_allowlist.rs             # Per-wallet allowlist management
│   └── assign_policy_authority.rs      # Rotate the policy authority
└── state/
    ├── hook_config.rs                  # HookConfig PDA — policy flags + params
    └── allowlist.rs                    # AllowlistEntry PDA — per-wallet status
```

### PDAs

| Account | Seeds | Purpose |
|---|---|---|
| `HookConfig` | `["policy", mint]` | Per-mint policy configuration |
| `ExtraAccountMetaList` | `["extra-account-metas", mint]` | Declares extra accounts Token-2022 must pass to Jetty |
| `AllowlistEntry` | `["allowlist", mint, token_account]` | Per-wallet allowlist status |

### Execute Flow

```
Transfer triggered
      │
      ▼
 Load HookConfig
      │
      ├─ paused? ──────────────────────────► TransferPaused
      │
      ├─ amount > maxTransferAmount? ──────► ExceedsVolumeLimit
      │
      └─ allowlistEnabled?
              │
              ├─ sender entry missing/inactive? ──► SourceNotAllowlisted
              │
              └─ receiver entry missing/inactive? ─► DestinationNotAllowlisted
                        │
                        ▼
                   Transfer passes
```

---

## Stack

| Layer | Tech |
|---|---|
| Program | Rust, Anchor 1.x, SPL Token-2022 |
| Tests | TypeScript, `@anchor-lang/core`, `@solana/spl-token` |
| CI | GitHub Actions — `solana-test-validator` |

---

## Getting started

### Prerequisites

```bash
anchor --version   # 1.0.2+
solana --version   # 3.x (Agave)
node --version     # 20+
yarn --version     # any
```

### Install and build

```bash
git clone https://github.com/yourusername/jetty
cd jetty
yarn install
anchor build
```

### Run tests

```bash
anchor test
```

---

## Integration guide

### Devnet Deployment Info
- **Program ID**: `[TO_BE_ADDED_AFTER_DEPLOYMENT]`
- **Passing Tests**: `[SCREENSHOT_TO_BE_ADDED_AFTER_DEPLOYMENT]`

### 1. Create your mint with Transfer Hook pointing at Jetty

### 1. Initialize policy for a mint

```ts
await program.methods
  .initializeHookConfig()
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
  })
  .rpc();
```

This creates the `HookConfig` PDA for your mint with all policies inactive by default.

### 3. Register the extra accounts

Must be called after `initializeHookConfig`. This writes the `ExtraAccountMetaList` account that Token-2022 reads to pass the right accounts to `execute` on every transfer.

```ts
await program.methods
  .initExtraAccountMetaList()
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .rpc();
```

### 3. Configure policy

All fields are `Option<T>` — omit any field you don't want to change by passing `null`.

```ts
// Pause all transfers
await program.methods
  .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null })
  .accounts({ mint, policyAuthority, hookConfig })
  .rpc();

// Set a volume limit of 1,000 tokens (assuming 6 decimals)
await program.methods
  .updatePolicy({ paused: null, allowlistEnabled: null, maxTransferAmount: new BN(1_000_000_000) })
  .accounts({ mint, policyAuthority, hookConfig })
  .rpc();

// Enable allowlist enforcement
await program.methods
  .updatePolicy({
    paused: false,
    allowlistEnabled: true,
    maxTransferAmount: new BN(1_000_000),
  })
  .accounts({
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
  })
  .rpc();
```

### 4. Manage allowlist

```ts
// Approve a wallet
await program.methods
  .updateAllowlist(true)   // false to deactivate
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    tokenAccount: userTokenAccountPubkey,
  })
  .rpc();
```

Revoking a wallet closes its `AllowlistEntry` account completely, removing it from the ledger and returning the rent to the payer. Re-approving it later is a reallocation via `init_if_needed`.

## Error Reference

| Error | Code | When it's thrown |
|---|---|---|
| 6000 | `TransferPaused` | `hook_config.paused` is true |
| 6001 | `ExceedsVolumeLimit` | `amount > hook_config.max_transfer_amount` |
| 6002 | `SourceNotAllowlisted` | Sender has no active `AllowlistEntry` |
| 6003 | `DestinationNotAllowlisted` | Receiver has no active `AllowlistEntry` |
| 6004 | `Unauthorized` | Caller is not `policy_authority` |
| 6005 | `NotTransferring` | `execute` called outside a real Token-2022 transfer |

---

## Security

- `execute` checks the `transferring` flag on the source token account — direct invocation without an active Token-2022 transfer is rejected.
- Only the `policy_authority` stored in `HookConfig` can mutate policy or allowlist state.
- Program upgrade authority should be moved to a multisig before mainnet deployment.

**Authority model.** The `policy_authority` stored in `HookConfig` is the only signer allowed to call `update_policy` and `update_allowlist`. It defaults to whoever initialized the config, but can be rotated to a separate compliance wallet so the mint authority and policy management keys are isolated.

**No unsafe code.** The program contains no `unsafe` blocks, no `unwrap()` or `expect()` in instruction handlers, and no heap allocations in the `execute` hot path.

- [x] Global pause
- [x] Volume limit
- [x] Allowlist
- [x] Atomic ATA initialization via `init_if_needed`
- [ ] On-chain audit log via events
- [ ] Off-chain KYC oracle integration
- [ ] Governance timelock for program upgrades
- [ ] Mainnet audit


## License

MIT
