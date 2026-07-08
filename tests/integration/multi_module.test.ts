/**
 * tests/integration/multi_module.test.ts
 *
 * Multiple compliance modules enabled simultaneously on the same mint.
 * This is the ONLY test class that can catch cross-module account ordering
 * or index-alignment bugs — single-module tests cannot surface these.
 *
 * Combinations tested:
 *   1. Pause + Allowlist
 *   2. Volume Limit + Vesting
 *   3. Denylist + Cooldown
 *   4. All 7 modules simultaneously (most important)
 */

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  getTokenAmount,
  transferWithHook,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";
import {
  updatePolicy,
  setAllowlist,
  setDenylist,
  setVestingLock,
  initCooldownEntry,
} from "../utils/fixtures";

describe("integration/multi_module", function () {
  this.timeout(400_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── Combo 1: Pause + Allowlist ─────────────────────────────────────────────

  describe("Pause + Allowlist simultaneously", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        allowlistEnabled: true,
        paused: false,
      });
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, true);
    });

    it("transfer succeeds when both allowed and unpaused", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("pause overrides allowlist: pausing blocks even properly allowlisted wallets", async () => {
      await updatePolicy(program, authority, fixture.mint.publicKey, { paused: true });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.TransferPaused
      );

      await updatePolicy(program, authority, fixture.mint.publicKey, { paused: false });
    });
  });

  // ── Combo 2: Volume Limit + Vesting ───────────────────────────────────────

  describe("Volume Limit + Vesting simultaneously", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        maxTransferAmount: new (require("bn.js"))(100),
        vestingEnabled: true,
      });
      // Sender has a vesting entry with past unlock — should not block
      const pastTs = Math.floor(Date.now() / 1000) - 3600;
      await setVestingLock(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, pastTs);
    });

    it("happy path: transfer within limit and past vesting date succeeds", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 50n,
        decimals: fixture.decimals,
      });
    });

    it("volume limit blocks even when vesting is unlocked", async () => {
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 101n,
          decimals: fixture.decimals,
        }),
        E.ExceedsVolumeLimit
      );
    });

    it("vesting blocks even when volume limit would permit the amount", async () => {
      const futureTs = Math.floor(Date.now() / 1000) + 86400;
      await setVestingLock(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, futureTs);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 50n,
          decimals: fixture.decimals,
        }),
        E.TokensLocked
      );
    });
  });

  // ── Combo 3: Denylist + Cooldown ─────────────────────────────────────────

  describe("Denylist + Cooldown simultaneously", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        denylistEnabled: true,
        cooldownSeconds: 5,
      });
      await initCooldownEntry(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount);
    });

    it("happy path: first transfer succeeds when neither denylisted nor in cooldown", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("cooldown blocks second transfer even when denylist would pass", async () => {
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.CooldownNotExpired
      );
    });

    it("denylist blocks transfer even after cooldown would expire", async () => {
      await new Promise((resolve) => setTimeout(resolve, 6_000));
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.SourceDenylisted
      );

      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);
    });
  });

  // ── Combo 4: ALL 7 MODULES SIMULTANEOUSLY ────────────────────────────────

  describe("ALL modules enabled simultaneously (critical combination)", () => {
    const SUPPLY = 10_000n;
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, SUPPLY);

      // Enable everything
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        paused: false,
        allowlistEnabled: true,
        maxTransferAmount: new (require("bn.js"))(500),
        minTransferAmount: new (require("bn.js"))(1),
        vestingEnabled: true,
        maxHolderBps: 5000,   // 50% of supply
        denylistEnabled: true,
        cooldownSeconds: 5,
      });

      // Allowlist both parties
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, true);

      // Vesting: past timestamp (unlocked)
      const pastTs = Math.floor(Date.now() / 1000) - 3600;
      await setVestingLock(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, pastTs);

      // Denylist: unflagged entries (PDA exists but flagged=false)
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, false);

      // Cooldown: initialized
      await initCooldownEntry(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount);
    });

    it("fully compliant transfer succeeds with all 7 modules active", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 100n,
        decimals: fixture.decimals,
      });

      expect(await getTokenAmount(provider, fixture.sourceTokenAccount))
        .to.equal(SUPPLY - 100n);
    });

    it("pause correctly fires TransferPaused while all other modules are active", async () => {
      await new Promise((resolve) => setTimeout(resolve, 6_000)); // cooldown
      await updatePolicy(program, authority, fixture.mint.publicKey, { paused: true });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 100n,
          decimals: fixture.decimals,
        }),
        E.TransferPaused,
        "pause fires correctly in all-modules-on state"
      );

      await updatePolicy(program, authority, fixture.mint.publicKey, { paused: false });
    });

    it("SourceNotAllowlisted fires correctly when sender is revoked in all-on state", async () => {
      await new Promise((resolve) => setTimeout(resolve, 6_000)); // cooldown
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 100n,
          decimals: fixture.decimals,
        }),
        E.SourceNotAllowlisted,
        "allowlist correctly fires in all-modules-on state"
      );

      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);
    });

    it("ExceedsVolumeLimit fires correctly in all-on state", async () => {
      await new Promise((resolve) => setTimeout(resolve, 6_000)); // cooldown

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 501n,
          decimals: fixture.decimals,
        }),
        E.ExceedsVolumeLimit,
        "volume limit fires correctly in all-modules-on state"
      );
    });

    it("SourceDenylisted fires correctly in all-on state", async () => {
      await new Promise((resolve) => setTimeout(resolve, 6_000)); // cooldown
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 100n,
          decimals: fixture.decimals,
        }),
        E.SourceDenylisted,
        "denylist fires correctly in all-modules-on state"
      );

      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);
    });
  });
});
