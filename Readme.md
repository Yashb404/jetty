# Jetty

> Universal on-chain compliance layer for SPL Token-2022 Transfer Hooks on Solana.

Token issuers point their mint's Transfer Hook at the Jetty program ID and configure modular compliance policies — no custom Rust required.

---

## Overview

Every SPL Token-2022 transfer is atomically intercepted by Jetty and evaluated against the issuer's active policy:

| Module | Behavior |
|---|---|
| **Global Pause** | Rejects all transfers when active |
| **Volume Limit** | Rejects transfers exceeding a configured `u64` threshold |
| **Allowlist** | Rejects transfers where sender or receiver lacks a valid on-chain allowlist entry |

One deployed program. Many mints. Each issuer owns and controls their own policy PDA — isolated by design.

---

## Architecture

```
programs/jetty/src/
├── lib.rs
├── error.rs
├── instructions/
│   ├── initialize_hook_config.rs       # Create policy PDA for a mint
│   ├── init_extra_account_meta_list.rs # Register extra accounts with Token-2022
│   ├── execute.rs                      # Core hook — invoked on every transfer
│   ├── update_policy.rs                # Pause, volume limit, allowlist toggle
│   └── update_allowlist.rs             # Per-wallet allowlist management
└── state/
    ├── hook_config.rs                  # HookConfig PDA — policy flags + params
    └── allowlist.rs                    # AllowlistEntry PDA — per-wallet status
```

### PDAs

| Account | Seeds | Purpose |
|---|---|---|
| `HookConfig` | `["policy", mint]` | Per-mint policy configuration |
| `ExtraAccountMetaList` | `["extra-account-metas", mint]` | Declares extra accounts Token-2022 must pass to Jetty |
| `AllowlistEntry` | `["allowlist", mint, wallet]` | Per-wallet allowlist status |

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

## Getting Started

### Prerequisites

```bash
anchor --version   # 1.0.2+
solana --version   # 3.x (Agave)
node --version     # 20+
yarn --version     # any
```

### Install

```bash
git clone https://github.com/yourusername/jetty
cd jetty
yarn install
```

### Build

```bash
anchor build
```

### Test

```bash
anchor test
```

---

## Usage

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

### 2. Register extra accounts with Token-2022

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
await program.methods
  .updateAllowlist(true)   // false to deactivate
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    wallet: userPubkey,
  })
  .rpc();
```

---

## Error Reference

| Code | Name | Trigger |
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

---

## Roadmap

- [x] Global pause
- [x] Volume limit
- [x] Allowlist
- [x] Atomic ATA initialization via `init_if_needed`
- [ ] On-chain audit log via events
- [ ] Off-chain KYC oracle integration
- [ ] Governance timelock for program upgrades
- [ ] Mainnet audit

---

## License

MIT
