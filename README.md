# Jetty

**Live Demo:** https://jetty-sol.vercel.app/
**Documentation Hub:** https://jetty-sol.vercel.app/docs

An open-source, no-code compliance layer for Token-2022 Transfer Hooks on Solana.

Jetty is designed to demonstrate how developers and issuers can enforce modular, on-chain compliance policies without writing a single line of custom Rust. By attaching the Jetty Program to your Token-2022 Transfer Hook, you gain a zero-code compliance dashboard to manage your token's rules.

**Disclaimer:** *Jetty is currently an unaudited MVP. It is designed as a proof-of-concept and should not be used in production with high-value assets until a formal security audit has been completed.*

---

## The Vision

Token-2022 introduced Transfer Hooks, but the barrier to entry for issuers to actually write, audit, and deploy custom Rust hooks is extremely high. Jetty was built to abstract this complexity.

The MVP ships with a comprehensive suite of core compliance modules — Global Pause, Volume Limits, Allowlist & Denylist, Vesting, Cooldowns, and Receiver Caps — all built on a single, modular execution pattern. The vision for Jetty is to be the place issuers come to manage their transfer hook needs, instead of writing and maintaining that logic themselves. Easy controls, vetted modules, and one dashboard — so compliance rules can be configured and trusted with confidence, without the overhead of running custom infrastructure.

---

## Core Modules

Every SPL Token-2022 transfer is atomically intercepted by Jetty and evaluated against the issuer's active policy on-chain.

| Module | Use Case | Mechanism |
|---|---|---|
| **Global Pause** | Exploit mitigation, migration | Instantly freezes all transfers across the entire token supply |
| **Volume Limits (Max/Min)** | Anti-whale, bot protection | Enforces a ceiling and/or floor on individual transfer amounts |
| **Allowlist & Denylist** | Permissioned trading, OFAC compliance | Restricts transfers to pre-approved accounts (Allowlist) or blocks flagged accounts while permitting everyone else by default (Denylist) |
| **Vesting Locks** | Team tokens, scheduled unlocks | Prevents outgoing transfers from an account until a configured Unix timestamp |
| **Receiver Cap** | Fair-launch distribution, anti-whale | Limits the maximum percentage of total supply a single wallet can accumulate |
| **Cooldown** | MEV protection, dump mitigation | Enforces a mandatory time-based waiting period between consecutive outgoing transfers |

All modules share a single execution pattern: each policy is a flag on the mint's `HookConfig`, checked inline inside one `execute` instruction with an early-exit design — a rejected transfer (e.g., a triggered Global Pause) aborts immediately rather than evaluating the remaining rules, and disabled modules cost next to nothing since they're skipped by their gating check.

---

## Technical Architecture

The Jetty MVP is built on a modern stack designed for high throughput and rapid iteration:

1. **Smart Contract Layer (Anchor/Rust):** Fully implements the SPL Transfer Hook interface. Uses a fixed, precomputed `ExtraAccountMetaList` so transfers are intercepted transparently without requiring callers to manually resolve extra accounts.
2. **Event Indexing (Helius Webhooks):** On-chain state changes are piped in real-time via Helius Webhooks to the backend.
3. **Edge Database (Turso / LibSQL):** Low-latency database storing the compliance audit trail and off-chain metadata.
4. **Admin Dashboard (Next.js):** A zero-code interface for policy authorities to manage their token's rules, with dedicated configuration views per module, client-side validation to prevent contradictory configurations (e.g., a minimum transfer amount set above the maximum), and warning banners for unusual-but-valid combinations (e.g., Allowlist and Denylist both active).
5. **RPC Security:** A rate-limited backend proxy (`/api/rpc`) keeps private RPC provider keys (Helius/QuickNode) out of the client bundle entirely.

---

## Security

- **The Handshake Rule:** Rotating the Policy Authority requires a dual-signature authorization — both the current and new authority must sign — to prevent accidental ownership loss.
- **Strict Transfer Verification:** The execute hook verifies it is being invoked via a legitimate Token-2022 transfer context, rejecting direct or malicious invocations.
- **Memory Safety:** The on-chain program is built with zero `unsafe` blocks and zero `unwrap()` panics in the execute hot path.

---

## Test Suite

The program is covered by a modular TypeScript/Mocha test suite, with each module tested in its own isolated file against a fresh mint and PDA state, asserting against specific custom Anchor error codes rather than generic failures.

---

## Roadmap

### Phase 1: Proof of Concept & MVP — Complete
- [x] SVM-optimized Transfer Hook architecture
- [x] Global Pause, Volume Limits (Max/Min), Receiver Cap
- [x] Allowlist, Denylist, Vesting, Cooldown
- [x] Handshake Rule for authority rotation
- [x] Helius Webhook + Turso DB integration for audit trails
- [x] Devnet deployment & Next.js admin dashboard with secured RPC proxy

### Phase 2: Extensibility & Production Readiness — Upcoming
- [ ] Directional Transfer Lock (send-only / receive-only accounts)
- [ ] DeFi Protocol Whitelist (exempt known AMM/DEX vaults from allowlist/denylist checks)
- [ ] Rolling 24-Hour Volume Limit (time-windowed velocity control)
- [ ] Custom Transfer Hook support — expand the module library with additional vetted policies as new needs emerge
- [ ] Hook Registry — a growing library of vetted compliance modules issuers can enable for their token with confidence
- [ ] Smart Contract Security Audit
- [ ] Off-Chain Oracles — allow Jetty to read from trusted KYC providers to auto-provision AllowlistEntry PDAs
- [ ] `@jetty/sdk` npm package
- [ ] Mainnet Beta Launch

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Yashb404/jetty
cd jetty

# Build the Anchor program
yarn install
anchor build

# Run the test suite
anchor test --skip-local-validator

# Start the admin dashboard
cd app
yarn install
yarn run dev
```

---

## License

MIT