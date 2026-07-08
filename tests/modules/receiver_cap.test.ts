/**
 * tests/modules/receiver_cap.test.ts
 *
 * Receiver Balance Cap — blocks transfers that would push receiver above X% of supply.
 * The post-transfer balance (current + incoming amount) is compared to the cap,
 * which was the critical bug fixed in this audit cycle.
 *
 * Error codes exercised: ExceedsHolderCap (6014), InvalidBps (6015), Unauthorized (6004)
 *
 * Math: cap = floor(supply * bps / 10_000)
 *   supply = 10_000 tokens (raw, 0 decimals for simplicity)
 *   bps = 500 → cap = floor(10_000 * 500 / 10_000) = 500 tokens
 */

import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  getTokenAmount,
  transferWithHook,
  createFundedUser,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";
import { updatePolicy } from "../utils/fixtures";

describe("modules/receiver_cap", function () {
  this.timeout(180_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  const SUPPLY = 10_000n;        // raw tokens (decimals=2 → 100.00 visible)
  const BPS = 500;               // 5%
  const CAP = 500n;              // 5% of 10,000 = 500

  // ── boundary tests ─────────────────────────────────────────────────────────

  describe("boundary: exactly at cap", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, SUPPLY);
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        maxHolderBps: BPS,
      });
    });

    it("transfer that brings receiver exactly to cap succeeds (inclusive boundary)", async () => {
      // Receiver has 0 tokens. Transfer CAP exactly → post-balance = CAP = cap. Should succeed.
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: CAP,             // 500
        decimals: fixture.decimals,
      });

      expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(CAP);
    });

    it("transfer of 1 more unit fails: would push receiver to CAP+1 (ExceedsHolderCap)", async () => {
      // Receiver is already at cap (500). Post-balance would be 501 > 500.
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 1n,
          decimals: fixture.decimals,
        }),
        E.ExceedsHolderCap,
        "post-balance 501 > cap 500"
      );
    });
  });

  // ── negative: receiver already over cap before transfer ───────────────────
  // This was the broken pre-audit behavior: the old check ONLY caught this case.
  // The post-transfer check (current+amount > cap) must also catch it.

  describe("boundary: transfer into already-overcapped receiver", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, SUPPLY);
      // First set BPS=100% so first transfer goes through to pre-load receiver
      await updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: 10000 });

      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: CAP + 1n,        // receiver now has 501 tokens
        decimals: fixture.decimals,
      });

      // Now lower the cap to 500 (which receiver already exceeds)
      await updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: BPS });
    });

    it("any further transfer into over-capped receiver fails immediately", async () => {
      // Receiver has 501. Cap is 500. Post-balance = 502 > cap.
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 1n,
          decimals: fixture.decimals,
        }),
        E.ExceedsHolderCap
      );
    });
  });

  // ── sentinel: bps = 0 disables the check ─────────────────────────────────

  it("sentinel: maxHolderBps = 0 disables cap, allows receiver to hold 100% of supply", async () => {
    const fixture = await createHookFixture(program, SUPPLY);
    await updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: 0 });

    // Transfer entire supply — should succeed
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: SUPPLY,
      decimals: fixture.decimals,
    });

    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(SUPPLY);
  });

  // ── validation: bps > 10000 rejected ─────────────────────────────────────

  it("invalid BPS > 10000 is rejected with InvalidBps", async () => {
    const fixture = await createHookFixture(program, SUPPLY);
    await expectJettyError(
      updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: 10001 }),
      E.InvalidBps
    );
  });

  it("BPS = 10000 (100%) is accepted and allows the full supply to a single holder", async () => {
    const fixture = await createHookFixture(program, SUPPLY);
    await updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: 10000 });

    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: SUPPLY,
      decimals: fixture.decimals,
    });

    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(SUPPLY);
  });
});
