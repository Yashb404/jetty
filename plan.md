# Jetty — Handoff Plan

Last updated: 2026-05-27

**Purpose:** concise handoff summarizing current status, completed work, pending productionization tasks, and immediate next steps to stabilize CI and publish the SDK.

**Current Branch / PR:**
- Branch: feature/jetty-ts-test-suite
- Active PR: Fix tests: use provider.sendAndConfirm; allow non-signer authority; clarify allowlist checks — https://github.com/Yashb404/jetty/pull/13

**Short status:**
- On-chain program: core changes applied and tested locally; `anchor test` reports passing integration tests locally (14 passing).
- TypeScript tests: switched to legacy Transaction + `provider.sendAndConfirm` to avoid modern signing-path base58 issues.
- SDK: `sdk/` scaffolded with PDA helpers, example, and jest test scaffold. Not yet published.
- CI: GitHub Actions updated to Node 20; cargo/anchor test job added. Some CI monitoring required on PR runs.

**Completed (short):**
- Stabilized failing tests locally by reverting to legacy signing path.
- Program changes: made `Execute.authority` an `UncheckedAccount` and relaxed some owner checks so domain errors surface correctly.
- Added `@jetty/sdk` scaffold with helpers and example.
- Added initial GitHub Actions workflow for Rust + Anchor tests and upgraded Node runtime to 20.
- Created initial HANDOFF/notes and opened PR #13.

**High-priority pending items (actionable):**
1. Add `package-lock.json` for `sdk/` (run `cd sdk && npm install`) and commit it to enable `npm ci` in CI.
2. Monitor PR #13 CI runs and fix any environment/workflow failures (set Node 20 is already done).
3. Add SDK unit tests to CI and gate publishing behind passing CI (do not publish until tests/docs pass).
4. Add automated security checks: `cargo audit` for Rust and `npm audit` / SCA for JS packages (fail on critical CVEs).
5. Add deterministic e2e tests that start a `solana-test-validator` in CI and run the Anchor/TS flows (seeded keys, deterministic PDAs).

**Medium-priority / optional items:**
- Implement on-chain `transfer_policy_authority` instruction (if you want contract-managed authority rotation).
- Implement `close_on_revoke` for `AllowlistEntry` (reclaim rent when entry is removed) or provide an explicit archive instruction.
- Add UI/dashboard controls for `HookConfig` (pause, volume, allowlist toggles) — useful but not required for core security.
- Prepare scripted steps + documentation to rotate program upgrade authority to a multisig (recommended before production deployment).

**Immediate next steps (exact commands):**
Run locally (creates lockfile for sdk and verifies tests):

```bash
# from repo root
cd sdk
npm install --no-audit --no-fund
npm test
cd ..
# commit the generated package-lock.json
git add sdk/package-lock.json
git commit -m "chore(sdk): add package-lock.json for CI deterministic installs"
git push origin feature/jetty-ts-test-suite
```

CI guidance:
- Until `sdk/package-lock.json` exists, prefer `npm install` in the CI job for `sdk` or add a step to create the lockfile.
- Add a separate job to run `cargo audit` and `npm audit` and fail PRs on critical findings.
- Add an e2e job that uses `solana-test-validator` and runs `anchor test --skip-local-validator=false` or explicit mocha/ts-mocha e2e scripts.

**Files to review (quick links):**
- Program entrypoints and checks: [programs/jetty/src/instructions/execute.rs](programs/jetty/src/instructions/execute.rs#L1)
- Allowlist and HookConfig state: [programs/jetty/src/state/allowlist.rs](programs/jetty/src/state/allowlist.rs#L1) and [programs/jetty/src/state/hook_config.rs](programs/jetty/src/state/hook_config.rs#L1)
- Tests: [tests/hookguard.ts](tests/hookguard.ts#L1)
- SDK: [sdk/index.ts](sdk/index.ts#L1) and example: [sdk/example.ts](sdk/example.ts#L1)
- CI workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml#L1)

**What to defer / not relevant right now:**
- Nothing is strictly irrelevant — all remaining items are either required for production readiness or optional UX/ops improvements. If you must prioritize, defer the dashboard UI and in-repo release automation until after CI + security + e2e are stable.

**Contacts & context:**
- PR: https://github.com/Yashb404/jetty/pull/13
- Local known issues: modern `createTransactionMessage` signing path produced a base58-length error; tests use legacy send path to remain stable until SDK/client signing path is hardened.

If you want, I can: (a) run `cd sdk && npm install` and commit `package-lock.json`, (b) add `cargo-audit` + `npm audit` steps to CI, or (c) implement the multisig rotation script next. Which should I do first?
