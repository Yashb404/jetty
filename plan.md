# Jetty — Handoff Plan

Last updated: 2026-06-18 (session 2)

**Purpose:** Comprehensive handoff document summarizing current status, completed work, divergences from the original `context.md` spec, and what remains to ship.

---

## Current Branch / PR
- Branch: `master` — `feature/jetty-ts-test-suite` merged via PR #16
- Active PR: None

---

## Progress vs. context.md Spec

### ✅ On-Chain Program — Completed

| Spec Item | Status | Notes |
|---|---|---|
| `initialize_hook_config` instruction | ✅ Done | Seeds `["policy", mint]`. Defaults all flags to false/0. |
| `init_extra_account_meta_list` instruction | ✅ Done | Fixed 3-account TLV encoding. Asserts `TOKEN_2022_PROGRAM_ID`. |
| `update_policy` instruction | ✅ Done | `Option<T>` args — `null` = no change. |
| `update_allowlist` instruction | ✅ Done | Uses `init_if_needed`. Seeds `["allowlist", mint, token_account]`. Manual closure logic for rent recovery on active=false. |
| `execute` instruction | ✅ Done | `UncheckedAccount` for authority. Checks `transferring` flag, mint match, authority binding, meta list owner, pause, volume, and allowlist. |
| Error codes (6000–6009) | ✅ Done | 10 error codes total (spec had 7; 3 additional: `InvalidTokenProgram`, `InvalidMetaListOwner`, `InvalidAuthority`). |
| No `unwrap()` in handlers | ✅ Done | |
| Stored bumps (no runtime derivation in hot path) | ✅ Done | |

### ⚠️ On-Chain Program — Deviations from context.md Spec

| Spec Requirement | Actual State | Impact |
|---|---|---|
| `assign_policy_authority` instruction | ✅ Implemented | Both current and new authority must co-sign the rotation. No-op same-key rotation rejected. Event emitted. 5 tests added. (Intentionally deviates from spec requiring mint authority to sign). |
| `ExtraAccountMetaList` seeded with `program_id` as 3rd seed | ⚠️ Actual seeds: `["extra-account-metas", mint]` only | Minor deviation; works correctly but differs from spec seeds. |

### ✅ Test Suite — Refactored & Expanded

**Monolithic `tests/hookguard.ts` split into per-instruction modules** (deprecated with banner, excluded from test runner glob). All tests pass with robust blockhash retry logic on localnet.

| File | Covers | New cases added |
|---|---|---|
| `tests/01_initialize.test.ts` | `initialize_hook_config`, `init_extra_account_meta_list` | — |
| `tests/02_update_policy.test.ts` | `update_policy` | Null-field partial updates preserve untouched fields; `maxTransferAmount=0` deactivates volume check |
| `tests/03_update_allowlist.test.ts` | `update_allowlist` | Revoke marks `active=false`; full revoke→re-activate lifecycle |
| `tests/04_execute.test.ts` | `execute` (transfer hook) | Exact-at-limit transfer passes; pause→unpause cycle resumes transfers; revoked sender blocked |
| `tests/05_assign_policy_authority.test.ts` | `assign_policy_authority` | Rotation succeeds; new authority can call `update_policy`; **old authority cannot** (regression integration test) |

- `tests/utils/setup.ts` added — shared `makeProvider`, `makeProgram`, `JETTY_ERROR` map, `expectJettyError` helper.
- `package.json` test script updated to `'tests/*.test.ts'` glob.
- `tsconfig.json` scoped to `tests/**/*` + `target/types/**/*`; `app/` explicitly excluded; `resolveJsonModule: true` added.
- SDK unit tests (`sdk/__tests__/index.test.ts`) remain CI-integrated on Node 20.

### ✅ TypeScript SDK (`sdk/`) — Completed

- `@jetty/sdk` exports: `deriveHookConfigPda`, `deriveExtraAccountMetaListPda`, `deriveAllowlistEntryPda`, `appendExtraAccounts`.
- Managed via Yarn (`sdk/yarn.lock`). No `package-lock.json` references remain.

### ✅ CI/CD — Mostly Complete

- GitHub Actions: `cargo-test`, `anchor-test`, `sdk-tests` (Node 20), `security-scan` all running.
- ⚠️ `|| true` overrides still present on `cargo audit` and `yarn audit` — audits are **informational only**, not blocking.

### 🆕 Frontend (`app/`) — Scaffolded, Not Implemented

- Next.js 15 App Router project scaffolded with Yarn (`app/yarn.lock`).
- Skeleton files exist for all routes (`/`, `/policy`, `/activity`) and all components.
- Solana Wallet Adapter and `@coral-xyz/anchor` packages installed.
- IDL (`lib/anchor/idl.json`) and type definitions (`lib/anchor/types.ts`) in place.
- ⚠️ **No working implementation exists yet** — all hooks and components contain empty boilerplate stubs only.

---

## What Is Left To Do

### 🔴 High Priority (Blocking Production)

1. **Remove `|| true` from security audit steps** in `.github/workflows/ci.yml` after resolving dependency vulnerabilities so CI blocks on critical CVEs.

### 🟡 Medium Priority (Frontend)

2. **Implement `contexts/ClientWalletProvider.tsx`** — Wire up `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider` from `@solana/wallet-adapter-react`.

3. **Implement `contexts/AnchorProvider.tsx`** — Create a real `AnchorProvider` instance from the connected wallet and expose the `Program` instance via context.

4. **Implement `lib/hooks/useJettyProgram.ts`** — Real instruction call wrappers: `initializeHookConfig`, `initExtraAccountMetaList`, `updatePolicy`, `updateAllowlist`.

5. **Implement `lib/hooks/useMintPolicy.ts`** — Fetch the `HookConfig` PDA for a given mint address and expose `policy`, `isInitialized`, `metaListExists`.

6. **Implement `lib/hooks/useAllowlist.ts`** — Fetch all `AllowlistEntry` accounts filtered by mint using `program.account.allowlistEntry.all([memcmp])`.

7. **Implement all page views** (`app/page.tsx`, `app/(routes)/policy/page.tsx`, `app/(routes)/activity/page.tsx`) per the 4 user story Epics:
    - Epic 1: Wallet connect + Mint address input + KPI summary cards.
    - Epic 2: Policy toggles (pause, volume cap, allowlist) + Save button.
    - Epic 3: Allowlist approve/revoke roster.
    - Epic 4: Onboarding wizard if mint is uninitialized.

8. **Implement UI components** with the "Moody Sophisticate" design from `Design.md` (palette: `#000000`, `#D1D1D0`, `#988686`, `#5C4E4E`). Apply to `button.tsx`, `card.tsx`, `input.tsx`, `sidebar.tsx`, `empty-state.tsx`, `wallet-connect.tsx`.

9. **Resolve the dual `yarn.lock` warning** in Next.js build — set `turbopack.root` in `next.config.ts` to silence the workspace root detection issue.

### 🟢 Lower Priority (Pre-Mainnet)

10. **Devnet deployment** — Deploy program, run end-to-end transfer success + failure flows, record transaction signatures.
11. **Upgrade authority multisig** — Rotate program upgrade authority to a multisig before mainnet.
12. **On-chain audit log** — Emit events (`HookConfigInitialized`, `PolicyUpdated`) and wire `activity/page.tsx` to display them.
13. **Context.md Readme alignment** — Update `context.md` or add a formal ADR documenting the three deviations (seeding strategy, no authority rotation, no PDA closure) so future contributors understand the intentional divergence.

---

## Immediate Next Commands

```bash
# Resolve Next.js workspace root warning
# Add to app/next.config.ts:
# turbopack: { root: __dirname }

# Remove || true from CI once audits are clean:
# Edit .github/workflows/ci.yml lines 156, 159, 169, 177

# Run security scans locally first to assess current state
cargo audit
cd app && yarn audit
cd ../sdk && yarn audit
```

---

## Architecture Reference (Current State)

### On-Chain Program (`programs/jetty`)
- **6 live instructions**: `initialize_hook_config`, `init_extra_account_meta_list`, `update_policy`, `update_allowlist`, `execute`, `assign_policy_authority`
- 3 PDAs: `HookConfig ["policy", mint]`, `AllowlistEntry ["allowlist", mint, token_account]`, `ExtraAccountMetaList ["extra-account-metas", mint]`
- 10 error codes (6000–6009)
- `PolicyAuthorityAssigned` event added to IDL

### TypeScript SDK (`sdk/`)
- PDA derivation helpers + `appendExtraAccounts` transaction helper
- Unit tested, CI-integrated on Node 20

### Frontend (`app/`)
- Next.js 15 App Router, Tailwind CSS, `@solana/wallet-adapter-react`, `@coral-xyz/anchor`
- Skeleton scaffolded — all files exist but contain stub implementations only
- Design system defined in `Design.md`
