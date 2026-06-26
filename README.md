# Jetty
<p align="center">
  <img src="https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=black" alt="Solana">
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Turso-4EEA96?style=for-the-badge&logo=sqlite&logoColor=black" alt="Turso">
</p>
**Live Demo**: [https://jetty-sol.vercel.app/](https://jetty-sol.vercel.app/)  
**Documentation Hub**: [https://jetty-sol.vercel.app/docs](https://jetty-sol.vercel.app/docs)
> An open-source, no-code Compliance Engine MVP for Token-2022 Transfer Hooks on Solana.
Jetty is designed to demonstrate how developers and issuers can enforce modular, on-chain compliance policies without writing a single line of custom Rust. By attaching the Jetty Program to your Token-2022 Transfer Hook, you gain a zero-code compliance dashboard to manage your token's rules. 
 **Disclaimer:** *Jetty is currently an unaudited MVP. It is designed as a proof-of-concept and should not be used in production with high-value assets until a formal security audit has been completed.*
---
## The Vision
Token-2022 introduced Transfer Hooks, but the barrier to entry for issuers to actually write, audit, and deploy custom Rust hooks is extremely high. 
Jetty was built to abstract this complexity. While the current MVP ships with three core compliance modules (Global Pause, Volume Limits, Allowlist), the ultimate vision for Jetty is to become an **extensible, universal hook registry**. Future iterations will support custom transfer hook injections, allowing protocols to snap together various hooks (e.g., royalty enforcement, vesting schedules, custom taxation) into a single, unified compliance layer managed entirely via the UI.
---
## Core Modules (Current MVP)
Every SPL Token-2022 transfer is atomically intercepted by Jetty and evaluated against the issuer's active policy on-chain.

| Module | Use Case | Mechanism |
| :--- | :--- | :--- |
| **Global Pause** | Exploit mitigation, migration | Instantly freezes all transfers across the entire token supply. |
| **Volume Limits** | Anti-whale, flash-loan prevention | Cryptographically rejects any transfer exceeding a configured `u64` limit. **Note:** A limit of `0` acts as an "off switch" and disables the cap entirely. To freeze transfers, use the Global Pause. |
| **KYC Allowlist** | Permissioned trading | Restricts transfers strictly to pre-approved sender and receiver **token accounts**. Approvals apply to the specific SPL token account, not the underlying owner wallet. |

---
## Technical Architecture
The Jetty MVP is built on a modern stack designed for high throughput and rapid iteration:
1. **Smart Contract Layer (Anchor/Rust):** Hyper-optimized SVM execution evaluating `HookConfig` and `AllowlistEntry` PDAs on every transfer.
2. **Event Indexing (Helius Webhooks):** Immutable on-chain state changes are piped in real-time via Helius Webhooks to our backend.
3. **Edge Database (Turso / LibSQL):** Low-latency database storing the compliance audit trail and off-chain metadata.
4. **Admin Dashboard (Next.js):** Sleek, zero-code UI for policy authorities to manage their token rules.
### Performance & Benchmarks
Transfer Hooks run on *every single token transfer*, meaning they must be exceptionally lightweight. 
* **Baseline Overhead**: The core hook execution adds merely **~3,700 Compute Units (CUs)** to a standard Token-2022 transfer.
* **Virtually Free Enforcement**: Numeric checks like the Volume Limit cost literally **+2 CUs** over the baseline.
* **Optimized Early-Exits**: Rejections (like triggering the Global Pause) halt execution early at ~30k CUs, preventing unnecessary compute drain.
---
## Security First
* **The Handshake Rule**: Rotating the Policy Authority requires a multi-sig authorization (both the *current* and *new* authority must sign) to prevent accidental ownership loss.
* **Strict Transfer Verification**: The `execute` hook verifies the `transferring` flag on the source token account. Direct, malicious invocations of the hook are automatically rejected.
* **Memory Safety**: The on-chain program contains zero `unsafe` blocks, zero unwraps (`unwrap()`/`expect()`), and zero heap allocations within the `execute` hot path.
---
## Roadmap
### Phase 1: Proof of Concept & MVP - *COMPLETED*
* [x] SVM-Optimized Transfer Hook Architecture
* [x] Global Pause, Volume Limits, and On-Chain Allowlist
* [x] Multi-Sig Authority Rotation (Handshake Rule)
* [x] Helius Webhook + Turso DB Integration for Audit Trails
* [x] Devnet Deployment & Next.js Admin Dashboard
### Phase 2: Extensibility & Production Readiness - *UPCOMING*
* [ ] **Custom Transfer Hooks Support:** Expand the architecture to support arbitrary, user-defined hooks and programmable logic blocks.
* [ ] **Hook Registry:** Build a marketplace/registry of audited hook modules that issuers can easily snap into their token.
* [ ] **Smart Contract Security Audit:** Comprehensive external audit of the core Anchor program.
* [ ] **Off-Chain Oracles:** Allow Jetty to read from trusted off-chain providers (e.g., KYC providers) to automatically provision `AllowlistEntry` PDAs.
* [ ] **SDK Release:** Publish `@jetty/sdk` to npm for seamless developer integration.
* [ ] **Mainnet Beta Launch.**
---
## Development Setup
```bash
# Clone the repository
git clone [https://github.com/yourusername/jetty](https://github.com/yourusername/jetty)
cd jetty
# Build the Anchor Program
yarn install
anchor build
# Run the test suite
anchor test --skip-local-validator
# Start the Admin Dashboard
cd app
yarn install
yarn run dev
```

## License 

MIT
