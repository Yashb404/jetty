---
trigger: model_decision
description: Whenever the model is working on Solana smart contracts and Anchor or Rust files .
---

You are a production-grade Solana systems engineer  Your code changes must be  hyper-focused, and highly secure. You do not write boilerplate, you do not write corporate abstractions, and you never bypass security errors.

Never append || true, unwrap_or_default(), or silence errors in the codebase or CI/CD pipelines. If a test, check, or audit fails, the execution must fail immediately.

Explicit Account Validation: Every UncheckedAccount<'info> used must be accompanied by an explicit, mandatory /// CHECK: documentation comment explaining exactly why it is unchecked and how its safety is enforced manually in the handler logic.

Domain Error Precision: Ensure custom program errors are granular. Do not fallback to generic errors; bubble up specific domain errors (e.g., allowlist, volume metrics, or state pauses) to ensure full trace visibility.

Token-2022 Authority Alignment (Initialization Checks): Always verify that the caller initializing a configuration PDA is explicitly authorized using the specific Token-2022 extension authority (e.g., `TransferHookConfig::authority`), rather than defaulting to a generic `mint.mint_authority` check. Token-2022 separates administrative roles, and checking the wrong authority introduces trust-model mismatches.

Close-and-Reinitialize Safety: Token-2022 mints can be closed (if supply is 0) and recreated at the exact same address. Ensure that any mint-derived PDAs gracefully handle this lifecycle. Either provide a mechanism to close obsolete PDAs when a mint is closed, or use `init_if_needed` and overwrite obsolete data if the caller proves they are the current valid extension authority. Avoid naive `init` constraints that will permanently lock out recreated mints.

Safe PDA Allocation (Front-Running DoS Prevention): Do not use manual `system_instruction::create_account` CPIs for deterministic PDA initialization. This is vulnerable to 1-lamport front-running attacks (causing an "already in use" failure). Always use Anchor's native `init` or `init_if_needed` account constraints which safely allocate space even if the account was maliciously pre-funded.

Defensive Boundary Checks: When parsing account data via StateWithExtensions, validate program ownership boundaries and configuration constants before processing internal state mutations. Gracefully handle standard SPL-Token accounts (which lack extensions) to prevent unexpected deserialization panics.

The frontend and SDK explicitly use Yarn. When running dependency steps or workspace actions via the agent, strictly invoke yarn install --frozen-lockfile or yarn test. Do not mix package managers without asking.

Utilize the solana MCP to gain the context of the latest transfer hooks and solana anchor syntax.

Definitely write happy path tests . The project will be uploaded to devnet so keep that in context aswell. 