# Jetty Issues Backlog

This backlog is intentionally specific. The project is still small, but every item below should be production-grade work that belongs in the final codebase, not a throwaway prototype task.

## On-chain smart contract issues

### 1. Bind `execute` to the real source token owner

### 2. Replace the manual `execute` discriminator with the SPL interface macro
`lib.rs` currently hardcodes the `execute` discriminator. That should be expressed through the SPL transfer-hook interface macro or the canonical interface constant so the program cannot drift from the protocol contract.

Acceptance criteria:
- `execute` uses the SPL transfer-hook interface mechanism rather than a handwritten byte array.
- The program still compiles and the hook remains invokable through Token-2022.
- A test confirms the hook still executes through the transfer path.

### 3. Enforce that `init_extra_account_meta_list` only accepts Token-2022
The extra-account meta initializer should reject any token program other than Token-2022. That is a protocol invariant, not an optional runtime assumption.

Acceptance criteria:
- `init_extra_account_meta_list` rejects non-Token-2022 program IDs.
- The check is explicit in the account constraints or handler.
- A negative test covers the wrong-program case.

### 4. Harden `extra_account_meta_list` validation and initialization
The validation PDA should be checked more strictly than just matching seeds. The account should be validated for ownership and initialization state, and re-initialization must not silently succeed.

Acceptance criteria:
- `execute` validates the meta list account ownership.
- `init_extra_account_meta_list` prevents accidental re-init over existing data.
- The account state assumptions are covered by tests.

### 5. Remove always-on allowlist account resolution from the hot path
The current extra-account meta strategy always carries allowlist PDAs, even when allowlist enforcement is disabled. That is acceptable for a prototype, but not ideal for a production hook.

Acceptance criteria:
- The account-resolution strategy is redesigned so the hot path only resolves the accounts required for the active policy state.
- The design is documented before implementation.
- The change does not weaken policy enforcement.

### 6. Add explicit failure cases for all policy branches
The program already has the basic policy checks, but the contract needs tests that prove each branch fails for the right reason and with the right error code.

Acceptance criteria:
- Pause, volume limit, allowlist, and unauthorized flows all have negative tests.
- Each test asserts the exact Jetty error.
- The transfer-hook direct invocation guard remains covered.

## Testing and verification issues

### 7. Expand the Anchor TS test suite into a full contract regression suite
The repository needs a proper regression suite for the on-chain program, not only a few happy-path checks. The tests should match the real policy lifecycle and the transfer-hook integration.

Acceptance criteria:
- There are tests for initialization, policy updates, allowlist updates, and transfer enforcement.
- The suite runs against the local validator and fails on real regressions.
- Test helpers are reusable and kept small.

### 8. Add a build-and-test check that runs before release or merge
Production-grade code needs a repeatable validation path. The project should have one clear command path for building and one for running the full test suite.

Acceptance criteria:
- `anchor build` and the main test suite both run from documented commands.
- The README or repo docs explain how to verify the contract locally.
- The process is stable enough to use in CI.

## Frontend issues

### 9. Create a real production dashboard shell
The frontend should not be a vague placeholder. It needs a minimal but durable application shell that can become the final dashboard without being rewritten.

Acceptance criteria:
- A Next.js app exists in `app/` with a proper layout, navigation, and consistent styling system.
- The app supports wallet connection and a clear empty state.
- The code is organized so feature pages can be added without restructuring the app.

### 10. Add a mint policy viewer for read-only operations
Before any admin controls are added, the frontend should be able to show the current policy state for a selected mint. That gives the project a concrete, useful first user flow.

Acceptance criteria:
- A user can enter or select a mint and load `HookConfig` state.
- The UI shows paused state, allowlist enabled state, and max transfer amount.
- Loading, empty, and error states are handled explicitly.

### 11. Add production-grade admin forms for policy updates
The admin UI should map directly to the existing smart-contract instructions instead of hiding them behind a generic dashboard abstraction.

Acceptance criteria:
- The UI has separate flows for initialize policy, update policy, initialize extra account metas, and update allowlist.
- Each form validates inputs before sending a transaction.
- The user sees transaction progress, failure, and confirmation states.
