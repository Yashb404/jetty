---
trigger: always_on
description: Whenever the model is working on Solana smart contracts and Anchor or Rust files .
---

When working on Rust code , especially smart contracts 

1. Error Handling


Never append || true, use unwrap_or_default(), or otherwise silence a failing check. If a test, build step, audit, or on-chain check fails, execution must fail immediately and visibly.
No blanket #[allow(clippy::...)] or #![allow(warnings)]. CI must fail on clippy warnings, not suppress them.
Domain errors only. Never fall back to a generic ErrorCode::InvalidInput-style catch-all. Every require!/err! must map to a specific, named error (e.g. AllowlistViolation, VolumeLimitExceeded, ProgramPaused) so failures are traceable from logs alone.


2. Account Validation


Every UncheckedAccount<'info> requires a /// CHECK: comment that names the specific invariant enforced manually in the handler — not a placeholder comment. "This account is safe" is a lint-satisfying no-op and is rejected.
Pin the token program explicitly. If Jetty targets Token-2022 only, reject the legacy SPL Token program ID in account constraints rather than assuming — don't silently support both unless that's an explicit design decision.
Validate StateWithExtensions boundaries: check program ownership and extension presence before deserializing. Gracefully reject (with a domain error) standard SPL-Token accounts that lack the extensions Jetty depends on — don't let them panic the deserializer.


3. Token-2022 Authority Model


Authorization for policy config PDAs must check the mint's TransferHook extension authority field — not mint.mint_authority. Token-2022 separates administrative roles; checking the wrong one is a trust-model bug, not a style choice.
TransferHook::authority is OptionalNonZeroPubkey and can be None (immutable hook, no further authority). Handle None explicitly — reject config-update instructions outright, never treat None as "anyone can update."


4. Transfer Hook Execute Instruction — No Signers


The Execute instruction is invoked via CPI from the token program mid-transfer. None of its accounts are signers. Never write or accept a signer check inside Execute — there is nothing to check, and any authorization logic here must come entirely from PDA seed derivation and on-chain state.
Nothing prevents a caller from invoking Execute directly, outside of a real transfer. Any state mutation inside Execute (e.g. volume-tracking updates) must remain safe under that condition — validation-only logic is fine, but stateful side effects need extra scrutiny.
Validate every account passed into Execute against its expected PDA derivation from the ExtraAccountMetaList. Don't trust account ordering/identity from the client.


5. PDA Allocation


Never use manual system_instruction::create_account CPIs for deterministic PDA init — vulnerable to 1-lamport front-running ("already in use" DoS). Always use Anchor's native init / init_if_needed, which allocate safely even against a pre-funded account.
Don't accept a caller-supplied bump for security-relevant PDAs; use Anchor's seeds + bump constraint (canonical bump) rather than trusting client input.


6. Mint Lifecycle (Close & Recreate)


A closed Token-2022 mint can, in principle, be recreated at the same address by whoever holds the keypair. Policy PDAs derived from mint.key() must not silently trust "current extension authority" as sufficient grounds to overwrite old state via init_if_needed.
Prefer an explicit, authority-gated migrate_policy instruction that bumps a version field, over blind init_if_needed overwrite. Migrations should be an audit event, not a side effect of initialization.


7. Arithmetic


All volume/limit accounting uses checked_add/checked_sub/checked_mul, bubbling a domain error (VolumeLimitExceeded, ArithmeticOverflow) on failure. No wrapping or saturating math on anything that gates a transfer decision.


8. Account Reallocation


Use AccountInfo::realloc(new_len: usize, zero_init: bool) — the two-argument method that currently exists in solana-program. There is no .resize() variant; do not write or accept code assuming one.
Pass zero_init: true only when growing→shrinking→growing within the same instruction and stale bytes matter; otherwise false to save compute.


9. Tooling


Frontend/SDK: Yarn only. Use yarn install --frozen-lockfile and yarn test in CI and locally. Don't mix package managers without explicit sign-off.
Prefer LiteSVM or solana-program-test/bankrun for test execution over a spun-up local validator, for CI speed — unless a test specifically needs validator-level behavior.


10. Testing


Every instruction needs both a happy-path and a sad-path test (at minimum: unauthorized caller, paused state, over-limit volume, non-allowlisted party, and — for Execute — a directly-invoked call outside a real transfer).
Target devnet for integration testing before any mainnet discussion.


11. Context Gathering


Use the Solana MCP (if connected) for current Transfer Hook interface and Anchor syntax rather than relying on possibly-stale training data — the interface has moved before and will again.