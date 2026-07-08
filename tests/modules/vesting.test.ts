/**
 * tests/modules/vesting.test.ts
 *
 * Vesting module — transfer blocked for sender until unlock_timestamp passes.
 * Error codes exercised: TokensLocked (6012), Unauthorized (6004)
 *
 * NOTE on timestamp boundary tests: we cannot manipulate on-chain clock in
 * this test environment (no BankRun / LiteSVM). Boundary cases use a timestamp
 * far in the past (always unlocked) vs. far in the future (always locked),
 * which is deterministic. The exact-second boundary (t = unlock_timestamp)
 * cannot be tested without clock control — this gap is documented.
 */

import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  getTokenAmount,
  transferWithHook,
  createFundedUser,
  deriveVestingEntryPda,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";
import { updatePolicy, setVestingLock, clearVestingLock } from "../utils/fixtures";

describe("modules/vesting", function () {
  this.timeout(180_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── enforcement ────────────────────────────────────────────────────────────

  describe("vesting lock enforcement", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, { vestingEnabled: true });
    });

    it("happy path: transfer succeeds when no VestingEntry exists (allow-by-default)", async () => {
      // Vesting is allow-by-default: if no PDA exists, transfer passes.
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("happy path: transfer succeeds when unlock_timestamp is in the past", async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      await setVestingLock(program, authority, fixture.mint.publicKey,
        fixture.sourceTokenAccount, pastTimestamp);

      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("negative: transfer fails when unlock_timestamp is in the future (tokens locked)", async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24h from now
      await setVestingLock(program, authority, fixture.mint.publicKey,
        fixture.sourceTokenAccount, futureTimestamp);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.TokensLocked
      );
    });

    it("happy path: transfer succeeds after clearVestingLock removes the entry", async () => {
      await clearVestingLock(program, authority, fixture.mint.publicKey,
        fixture.sourceTokenAccount);

      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });
  });

  // ── disabled-state bypass ─────────────────────────────────────────────────

  it("disabled-state: locked entry does not block transfer when vestingEnabled = false", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    // Set a future lock but keep vestingEnabled = false (default)
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;
    await setVestingLock(program, authority, fixture.mint.publicKey,
      fixture.sourceTokenAccount, futureTimestamp);

    // Should succeed — vesting module is disabled
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  // ── state verification ─────────────────────────────────────────────────────

  it("VestingEntry stores correct data after setVestingLock", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const ts = 999_999_999;
    await setVestingLock(program, authority, fixture.mint.publicKey,
      fixture.sourceTokenAccount, ts);

    const [vestingPda] = deriveVestingEntryPda(
      fixture.mint.publicKey, fixture.sourceTokenAccount, program.programId
    );
    const entry = await program.account.vestingEntry.fetch(vestingPda, "confirmed");
    expect(entry.mint.equals(fixture.mint.publicKey)).to.equal(true);
    expect(entry.tokenAccount.equals(fixture.sourceTokenAccount)).to.equal(true);
    expect(entry.unlockTimestamp.toNumber()).to.equal(ts);
  });

  // ── authorization ─────────────────────────────────────────────────────────

  it("authorization: non-authority cannot set a vesting lock", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const attacker = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .setVestingLock(new (require("bn.js"))(999999999))
        .accounts({
          payer: attacker.publicKey,
          policyAuthority: attacker.publicKey,
          mint: fixture.mint.publicKey,
          tokenAccount: fixture.sourceTokenAccount,
        } as any)
        .signers([attacker])
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized
    );
  });

  it("authorization: non-authority cannot clear a vesting lock", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const futureTs = Math.floor(Date.now() / 1000) + 3600;
    await setVestingLock(program, authority, fixture.mint.publicKey,
      fixture.sourceTokenAccount, futureTs);

    const attacker = await createFundedUser(provider);
    await expectJettyError(
      program.methods
        .clearVestingLock()
        .accounts({
          payer: attacker.publicKey,
          policyAuthority: attacker.publicKey,
          mint: fixture.mint.publicKey,
          tokenAccount: fixture.sourceTokenAccount,
        } as any)
        .signers([attacker])
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized
    );
  });

  // Gap: exact-second boundary (transfer at t = unlock_timestamp exactly) cannot
  // be tested without clock manipulation (BankRun/LiteSVM).
  // TODO: Port this file to LiteSVM once integrated.
});
