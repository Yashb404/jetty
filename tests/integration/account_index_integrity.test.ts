/**
 * tests/integration/account_index_integrity.test.ts
 *
 * ============================================================
 * HIGHEST PRIORITY TEST IN THIS SUITE
 * ============================================================
 *
 * Purpose: Confirm that the IDX_* constants in execute.rs correctly map each
 * remaining_accounts[i] to the PDA the program actually reads from that slot.
 *
 * Method:
 *   1. Initialize a fresh mint with all modules enabled and all PDAs created.
 *   2. Execute a real transfer and capture program logs.
 *   3. The temporary msg!() loop in execute.rs prints:
 *        remaining_accounts[0] = <key>
 *        remaining_accounts[1] = <key>
 *        ...
 *   4. Independently derive the expected PDA for each slot using the same seeds
 *      the program uses.
 *   5. Assert each printed key matches its expected derivation.
 *
 * This test directly resolves the open question from the audit — reasoning
 * about static code is not sufficient given the history of this exact bug
 * class in this codebase.
 *
 * If this test fails, the remaining_accounts indices are misaligned and
 * every module that runs after the first correct one is reading the wrong account.
 */

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHookAndLogs,
  deriveAllowlistEntryPda,
  deriveVestingEntryPda,
  deriveDenylistEntryPda,
  deriveCooldownEntryPda,
} from "../utils/helpers";
import { makeProvider, makeProgram } from "../utils/setup";
import { updatePolicy, setAllowlist, setDenylist, setVestingLock, initCooldownEntry } from "../utils/fixtures";

describe("integration/account_index_integrity", function () {
  this.timeout(300_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("remaining_accounts indices match independently-derived PDAs for each module", async () => {
    const fixture = await createHookFixture(program, 1_000n);

    // ── Enable all modules ────────────────────────────────────────────────
    await updatePolicy(program, authority, fixture.mint.publicKey, {
      allowlistEnabled: true,
      vestingEnabled: true,
      denylistEnabled: true,
      cooldownSeconds: 5,
    });

    // ── Initialize all required PDAs ──────────────────────────────────────
    // Allowlist: both sides must exist
    await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);
    await setAllowlist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, true);

    // Vesting: set a past timestamp so it doesn't block the transfer
    const pastTs = Math.floor(Date.now() / 1000) - 3600;
    await setVestingLock(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, pastTs);

    // Denylist: create unflagged entry so PDA exists at the slot
    await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);
    await setDenylist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, false);

    // Cooldown: init entry
    await initCooldownEntry(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount);

    // ── Independently derive all expected PDAs ────────────────────────────
    // Order MUST match build_extra_account_metas() in utils.rs.
    // Meta list index 0 = hook_config (consumed as named struct field, NOT in remaining_accounts)
    // Meta list index 1 → remaining_accounts[0]: source allowlist
    const [expectedAllowlistSrc] = deriveAllowlistEntryPda(
      fixture.mint.publicKey, fixture.sourceTokenAccount, program.programId
    );
    // Meta list index 2 → remaining_accounts[1]: destination allowlist
    const [expectedAllowlistDst] = deriveAllowlistEntryPda(
      fixture.mint.publicKey, fixture.destinationTokenAccount, program.programId
    );
    // Meta list index 3 → remaining_accounts[2]: sender vesting
    const [expectedVesting] = deriveVestingEntryPda(
      fixture.mint.publicKey, fixture.sourceTokenAccount, program.programId
    );
    // Meta list index 4 → remaining_accounts[3]: sender denylist
    const [expectedDenylistSrc] = deriveDenylistEntryPda(
      fixture.mint.publicKey, fixture.sourceTokenAccount, program.programId
    );
    // Meta list index 5 → remaining_accounts[4]: receiver denylist
    const [expectedDenylistDst] = deriveDenylistEntryPda(
      fixture.mint.publicKey, fixture.destinationTokenAccount, program.programId
    );
    // Meta list index 6 → remaining_accounts[5]: sender cooldown (writable)
    const [expectedCooldown] = deriveCooldownEntryPda(
      fixture.mint.publicKey, fixture.sourceTokenAccount, program.programId
    );
    // Indices 6-8 (exemption×2, volume) are reserved future slots — not verified here.

    const expected: { [index: number]: { name: string; key: anchor.web3.PublicKey } } = {
      0: { name: "allowlist_src", key: expectedAllowlistSrc },
      1: { name: "allowlist_dst", key: expectedAllowlistDst },
      2: { name: "vesting_src",   key: expectedVesting },
      3: { name: "denylist_src",  key: expectedDenylistSrc },
      4: { name: "denylist_dst",  key: expectedDenylistDst },
      5: { name: "cooldown_src",  key: expectedCooldown },
    };

    // ── Execute transfer and capture logs ─────────────────────────────────
    const { logs } = await transferWithHookAndLogs(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });

    // ── Parse remaining_accounts[i] = <pubkey> from logs ─────────────────
    const loggedKeys: { [index: number]: string } = {};
    for (const line of logs) {
      // Matches: "  remaining_accounts[5] = ABC123..."
      const m = line.match(/remaining_accounts\[(\d+)\]\s*=\s*([A-Za-z0-9]+)/);
      if (m) {
        loggedKeys[parseInt(m[1])] = m[2];
      }
    }

    console.log("\n=== Account Index Integrity Report ===");
    let allPass = true;

    for (const [idx, { name, key }] of Object.entries(expected).map(
      ([i, v]) => [parseInt(i), v] as [number, { name: string; key: anchor.web3.PublicKey }]
    )) {
      const logged = loggedKeys[idx];
      const expectedBase58 = key.toBase58();
      const match = logged === expectedBase58;

      if (!match) allPass = false;

      console.log(
        `  remaining_accounts[${idx}] (${name}): ${match ? "✓ MATCH" : "✗ MISMATCH"}`
      );
      if (!match) {
        console.log(`    Expected: ${expectedBase58}`);
        console.log(`    Got:      ${logged ?? "(not logged)"}`);
      }

      // Fail explicitly per-slot so the first misalignment is immediately visible
      expect(
        logged,
        `remaining_accounts[${idx}] (${name}) was not logged — msg!() loop may be missing`
      ).to.not.equal(undefined);

      expect(
        logged,
        `remaining_accounts[${idx}] (${name}) MISMATCH: expected ${expectedBase58}, got ${logged}`
      ).to.equal(expectedBase58);
    }

    console.log(allPass
      ? "\n✓ All account indices verified correct — IDX_* mapping is confirmed.\n"
      : "\n✗ Account index misalignment detected — fix IDX_* constants in execute.rs.\n"
    );
  });

  // ── Diagnostic: log all 9 remaining_accounts keys unconditionally ─────
  it("logs all 9 remaining_accounts keys for manual cross-reference", async () => {
    // A simpler fixture with no modules enabled — all slots are still populated
    // by the Token-2022 program from the ExtraAccountMetaList, but none block.
    const fixture = await createHookFixture(program, 1_000n);

    const { logs } = await transferWithHookAndLogs(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });

    console.log("\n=== All remaining_accounts keys (no modules enabled) ===");
    for (const line of logs) {
      if (line.includes("remaining_accounts") || line.includes("execute:")) {
        console.log(" ", line);
      }
    }
  });
});
