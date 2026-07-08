/**
 * 12_multi_module.test.ts
 *
 * Integration test: multiple compliance modules enabled simultaneously on the
 * same mint + transfer. This is the ONLY test class that surfaces a
 * remaining_accounts index misalignment between modules — isolated tests only
 * verify their own module's account reads, so a cross-module indexing bug
 * passes 49/49 tests and still ships broken.
 *
 * Modules under test: Allowlist + Denylist + Cooldown (all active at once).
 */

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  getTokenAmount,
  transferWithHook,
} from "./utils/helpers";
import {
  makeProvider,
  makeProgram,
  JETTY_ERROR,
  expectJettyError,
} from "./utils/setup";

describe("Multi-Module: Allowlist + Denylist + Cooldown simultaneously", function () {
  this.timeout(300_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;

  // ── shared helpers ────────────────────────────────────────────────────────

  async function allowlist(
    mintPubkey: anchor.web3.PublicKey,
    tokenAccount: anchor.web3.PublicKey
  ): Promise<void> {
    await program.methods
      .updateAllowlist(true)
      .accounts({ payer: authority, policyAuthority: authority, mint: mintPubkey, tokenAccount })
      .rpc({ commitment: "confirmed" });
  }

  // ── setup: one fresh fixture with all three modules enabled ───────────────

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);

    // Enable Allowlist + Denylist + Cooldown (5-second window) all at once.
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: true,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: true,
        cooldownSeconds: 5,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Allowlist both sides so the allowlist module itself doesn't block.
    await allowlist(fixture.mint.publicKey, fixture.sourceTokenAccount);
    await allowlist(fixture.mint.publicKey, fixture.destinationTokenAccount);

    // Initialize the sender's cooldown PDA so the cooldown module can write to it.
    await program.methods
      .initCooldownEntry()
      .accounts({
        payer: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });
  });

  // ── test cases ────────────────────────────────────────────────────────────

  it("happy path: first transfer succeeds with all three modules active", async () => {
    // First transfer — cooldown PDA exists but timestamp=0, so cooldown passes.
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });

    expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(990n);
    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(10n);
  });

  it("cooldown blocks second immediate transfer even though allowlist passes", async () => {
    // Second transfer immediately — cooldown window (5s) not expired.
    // This verifies:
    //   (a) cooldown is read from remaining_accounts[IDX_COOLDOWN_SENDER=5], not from
    //       a wrong slot that would contain an allowlist or denylist PDA, and
    //   (b) the allowlist check at [0]/[1] and denylist check at [3]/[4] don't
    //       interfere with cooldown's read at [5].
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.CooldownNotExpired
    );
  });

  it("denylist blocks transfer even when both allowlist + cooldown would pass", async () => {
    // Flag the sender on the denylist.
    await program.methods
      .updateDenylist(true)
      .accounts({
        payer: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    // Wait for cooldown to expire so it's not the blocking factor.
    await new Promise((resolve) => setTimeout(resolve, 6_000));

    // Denylist should block — this verifies remaining_accounts[IDX_DENYLIST_SENDER=3]
    // actually contains the denylist PDA, not an allowlist or vesting PDA at that slot.
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.SourceDenylisted
    );

    // Unflag for subsequent tests.
    await program.methods
      .updateDenylist(false)
      .accounts({
        payer: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });
  });

  it("allowlist blocks transfer when sender is revoked, even if denylist + cooldown pass", async () => {
    // Wait for cooldown to clear.
    await new Promise((resolve) => setTimeout(resolve, 6_000));

    // Revoke sender from allowlist.
    await program.methods
      .updateAllowlist(false)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    // Allowlist check at remaining_accounts[0] should catch this — verifying
    // the allowlist slot hasn't been displaced by another module's PDA.
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.SourceNotAllowlisted
    );
  });

  it("cooldown bound: rejects cooldown_seconds > 30 days", async () => {
    const THIRTY_DAYS_PLUS_ONE = 2_592_001;
    await expectJettyError(
      program.methods
        .updatePolicy({
          paused: null,
          allowlistEnabled: null,
          maxTransferAmount: null,
          vestingEnabled: null,
          minTransferAmount: null,
          maxHolderBps: null,
          denylistEnabled: null,
          cooldownSeconds: THIRTY_DAYS_PLUS_ONE,
        })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.CooldownTooLong
    );
  });
});
