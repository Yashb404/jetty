# Jetty

> Universal on-chain compliance program for SPL Token-2022 Transfer Hooks on Solana.

Token issuers point their mint's Transfer Hook authority at the Jetty program ID and configure modular compliance policies via a dashboard — no Rust required.

---

## What It Does

Every SPL Token-2022 transfer is intercepted by Jetty and evaluated against the issuer's active policy modules:

| Module | Behavior |
|---|---|
| **Global Pause** | Rejects all transfers when enabled |
| **Volume Limit** | Rejects transfers exceeding a configured `u64` amount |
| **Allowlist** | Rejects transfers where sender or receiver lacks a valid allowlist PDA |

One deployed program. Many mints. Each issuer owns their own policy PDA.

---

## Architecture

```
programs/jetty/src/
├── lib.rs
├── error.rs
├── instructions/
│   ├── mod.rs
│   ├── initialize_hook_config.rs       # Create policy PDA for a mint
│   ├── init_extra_account_meta_list.rs # Register extra accounts with Token-2022
│   ├── execute.rs                      # Core hook — called on every transfer
│   ├── update_policy.rs                # Toggle pause, set volume limit, toggle allowlist
│   └── update_allowlist.rs             # Add/remove wallets from allowlist registry
└── state/
    ├── mod.rs
    ├── hook_config.rs                  # HookConfig PDA — policy flags + params
    └── allowlist.rs                    # AllowlistEntry PDA — per-wallet status
```

**Key PDAs:**

| Account | Seeds | Purpose |
|---|---|---|
| `HookConfig` | `["policy", mint]` | Per-mint policy configuration |
| `ExtraAccountMetaList` | `["extra-account-metas", mint]` | Tells Token-2022 which extra accounts Jetty needs |
| `AllowlistEntry` | `["allowlist", mint, wallet]` | Per-wallet allowlist status |

---

## Tech Stack

- **Program:** Rust, Anchor 0.31+, SPL Token-2022
- **Client/Tests:** TypeScript, `@solana/kit` (web3.js v2), `@solana/spl-token`
- **Dashboard:** Next.js, Tailwind CSS
- **Testing:** Anchor TS test suite + `solana-test-validator`

---

## Getting Started

### Prerequisites

```bash
anchor --version   # 0.31+
solana --version   # 1.18+
node --version     # 18+
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

### Deploy (devnet)

```bash
anchor deploy --provider.cluster devnet
```

---

## Usage

### 1. Initialize policy for your mint

```ts
await program.methods
  .initializeHookConfig()
  .accounts({ mint, authority })
  .rpc();
```

### 2. Register extra accounts with Token-2022

```ts
await program.methods
  .initExtraAccountMetaList()
  .accounts({ mint, authority })
  .rpc();
```

### 3. Configure policies

```ts
await program.methods
  .updatePolicy({
    paused: false,
    allowlistEnabled: true,
    maxTransferAmount: new BN(1_000_000),
  })
  .accounts({ mint, authority })
  .rpc();
```

### 4. Add wallets to allowlist

```ts
await program.methods
  .updateAllowlist({ wallet: userPubkey, active: true })
  .accounts({ mint, authority })
  .rpc();
```

---

## Policy Logic (Execute)

Called automatically by Token-2022 on every transfer:

```
1. Load HookConfig PDA for mint
2. If paused → TransferPaused error
3. If amount > maxTransferAmount → ExceedsVolumeLimit error
4. If allowlistEnabled → verify sender + receiver AllowlistEntry PDAs → NotAllowlisted error
```

---

## Custom Errors

| Code | Name | Trigger |
|---|---|---|
| 6000 | `TransferPaused` | Global pause is active |
| 6001 | `ExceedsVolumeLimit` | Transfer amount > configured limit |
| 6002 | `NotAllowlisted` | Sender or receiver not in allowlist |
| 6003 | `Unauthorized` | Caller is not policy authority |

---

## Security Notes

- Only `mint_authority` or designated `policy_authority` can modify `HookConfig`.
- `execute` verifies the `transferring` flag on the source token account — prevents direct invocation without a real Token-2022 transfer.
- Program upgrade authority should be moved to a multisig before mainnet use.

---

## Roadmap

- [x] MVP: Pause, Volume Limit, Allowlist
- [ ] On-chain audit trail / event logging
- [ ] Off-chain KYC provider integration (identity oracle)
- [ ] Governance timelock for program upgrades
- [ ] Mainnet audit

---

## License

MIT