# Jetty

Jetty is a shared on-chain compliance program for SPL Token-2022 Transfer Hooks on Solana. Instead of every token issuer writing and deploying their own custom Rust hook program, they point their mint's Transfer Hook authority at the Jetty program ID and configure their compliance rules through a dashboard.

The program lives on-chain once. Each issuer owns a policy account for their mint. Every transfer gets checked against whatever rules the issuer has set.

---

## How it works

SPL Token-2022 has a Transfer Hook extension that fires a CPI into a designated program on every token transfer. Jetty is that program. When a transfer happens, Token-2022 calls Jetty's `execute` instruction, which loads the policy config for that mint and either lets the transfer through or rejects it with a specific error.

Three policy modules are available, each independently toggleable per mint:

| Module | What it does |
|---|---|
| **Global Pause** | Rejects every transfer for the mint instantly. Useful for emergency freezes or regulatory holds. |
| **Volume Limit** | Rejects any single transfer above a configured token amount. Set to 0 to turn it off. |
| **Allowlist** | Requires both the sender and receiver to be pre-approved. Wallets are approved individually via a PDA per wallet. |

Policies take effect immediately after the update transaction confirms. There is no delay.

---

Project status
Active development. Not yet production-ready.
Current focus:

Core program correctness and instruction coverage
ExtraAccountMetaList wiring and transfer hook integration testing
Test suite reliability across all policy modules
Dashboard UI and policy management UX
Devnet deployment and end-to-end validation

---

## Program accounts

Three PDA types, all derived deterministically:

| Account | Seeds | What it stores |
|---|---|---|
| `HookConfig` | `["policy", mint]` | Policy flags and parameters for a mint |
| `ExtraAccountMetaList` | `["extra-account-metas", mint]` | Tells Token-2022 which extra accounts to pass Jetty on each transfer |
| `AllowlistEntry` | `["allowlist", mint, wallet]` | Whether a specific wallet is approved for a specific mint |

The `ExtraAccountMetaList` account uses the TLV encoding format expected by the `spl-tlv-account-resolution` crate. Token-2022 reads it automatically to resolve and inject the correct accounts into the `execute` CPI — the caller doesn't need to do anything extra beyond using `createTransferCheckedWithTransferHookInstruction`.

---

## Project structure

```
programs/jetty/src/
├── lib.rs
├── error.rs
├── instructions/
│   ├── mod.rs
│   ├── initialize_hook_config.rs       # Create the HookConfig PDA for a mint
│   ├── init_extra_account_meta_list.rs # Allocate and populate the ExtraAccountMetaList PDA
│   ├── execute.rs                      # Core hook logic — invoked by Token-2022 on every transfer
│   ├── update_policy.rs                # Update pause/volume/allowlist flags
│   └── update_allowlist.rs             # Add or remove a wallet from the allowlist
└── state/
    ├── mod.rs
    ├── hook_config.rs
    └── allowlist.rs

tests/
├── hookguard.ts
└── utils/helpers.ts

app/                                    # Next.js dashboard
```

---

## Tech stack

- **Program:** Rust, Anchor 0.31+, `spl-token-2022`, `spl-transfer-hook-interface`, `spl-tlv-account-resolution`
- **Tests:** TypeScript, `@solana/kit` (web3.js v2), `@solana/spl-token`
- **Dashboard:** Next.js, Tailwind CSS

---

## Getting started

### Prerequisites

```bash
anchor --version   # 0.31+
solana --version   # 1.18+
node --version     # 18+
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

Tests create a real Token-2022 mint with the Transfer Hook extension pointing at the local Jetty deployment, then exercise every policy module through valid and invalid transfers.

### Deploy to devnet

```bash
anchor deploy --provider.cluster devnet
```

---

## Integration guide

### 1. Create your mint with Transfer Hook pointing at Jetty

When minting your Token-2022 token, set the Transfer Hook extension's program ID to the Jetty program ID before calling `InitializeMint`.

### 2. Initialize your policy config

```ts
await program.methods
  .initializeHookConfig()
  .accounts({ mint, policyAuthority, systemProgram })
  .rpc();
```

This creates the `HookConfig` PDA for your mint with all policies inactive by default.

### 3. Register the extra accounts

```ts
await program.methods
  .initExtraAccountMetaList()
  .accounts({ mint, policyAuthority, extraAccountMetaList, tokenProgram, systemProgram })
  .rpc();
```

This must be called before any transfer can succeed. It allocates the `ExtraAccountMetaList` PDA that Token-2022 uses to resolve Jetty's accounts on each transfer.

### 4. Configure policies

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
  .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null })
  .accounts({ mint, policyAuthority, hookConfig })
  .rpc();
```

Policy args use `Option` types — pass `null` for any field you don't want to change.

### 5. Manage the allowlist

```ts
// Approve a wallet
await program.methods
  .updateAllowlist(true)
  .accounts({ mint, policyAuthority, hookConfig, wallet: userPubkey, allowlistEntry, systemProgram })
  .rpc();

// Revoke a wallet
await program.methods
  .updateAllowlist(false)
  .accounts({ mint, policyAuthority, hookConfig, wallet: userPubkey, allowlistEntry, systemProgram })
  .rpc();
```

Revoking a wallet marks its `AllowlistEntry` as inactive but keeps the account open. Re-approving it later is a single update, not a reallocation.

### 6. Transfer tokens

Use `createTransferCheckedWithTransferHookInstruction` from `@solana/spl-token`. This automatically reads the `ExtraAccountMetaList` PDA and appends the required accounts to the instruction. Standard `transferChecked` will not work — it won't include the hook accounts.

```ts
const ix = await createTransferCheckedWithTransferHookInstruction(
  connection,
  sourceTokenAccount,
  mint,
  destinationTokenAccount,
  owner,
  amount,
  decimals,
  [],
  "confirmed",
  TOKEN_2022_PROGRAM_ID
);
```

---

## Error reference

| Error | Code | When it's thrown |
|---|---|---|
| `TransferPaused` | 6000 | `paused` is true on the mint's HookConfig |
| `ExceedsVolumeLimit` | 6001 | Transfer amount is above `maxTransferAmount` |
| `SourceNotAllowlisted` | 6002 | Sender's AllowlistEntry is missing or inactive |
| `DestinationNotAllowlisted` | 6003 | Receiver's AllowlistEntry is missing or inactive |
| `Unauthorized` | 6004 | Signer is not the `policyAuthority` for this mint |
| `NotTransferring` | 6005 | `execute` was called directly, not via a real Token-2022 transfer |
| `MintMismatch` | 6006 | The mint in the instruction accounts doesn't match the one stored in HookConfig |

---

## Security

**Transferring flag check.** Jetty's `execute` instruction verifies that the source token account has the `transferring` extension flag set before doing anything else. This flag is only true during an active Token-2022 transfer CPI. Without this check, anyone could call `execute` directly to probe state or cause unintended side effects.

**Authority model.** The `policy_authority` stored in `HookConfig` is the only signer allowed to call `update_policy` and `update_allowlist`. It defaults to whoever initialized the config, but can be rotated to a separate compliance wallet so the mint authority and policy management keys are isolated.

**No unsafe code.** The program contains no `unsafe` blocks, no `unwrap()` or `expect()` in instruction handlers, and no heap allocations in the `execute` hot path.

**Upgrade authority.** The program's upgrade authority should be transferred to a multisig before any production use. A single-key upgrade authority means a compromised key can push a malicious program update that affects every mint pointing at Jetty.


## License

MIT
