/**
 * tests/integration/runtime_toggle.test.ts
 *
 * Tests the exact failure mode that occurred in this project's history:
 * a module that was toggled ON at runtime (not at init) must correctly
 * resolve its PDA from remaining_accounts on the very next transfer.
 *
 * For each module under test:
 *   1. Start with module disabled → transfer succeeds.
 *   2. Enable module via update_policy.
 *   3. Transfer now exercises the module's check (both pass and fail cases).
 *
 * Modules covered: Allowlist, Vesting, Denylist, Cooldown.
 */

import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";
import {
  updatePolicy,
  setAllowlist,
  setVestingLock,
  setDenylist,
  initCooldownEntry,
} from "../utils/fixtures";

describe("integration/runtime_toggle", function () {
  this.timeout(300_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── Allowlist runtime toggle ────────────────────────────────────────────────

  describe("Allowlist: disabled → enabled at runtime", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
    });

    it("step 1: transfer succeeds with allowlist disabled (no PDAs required)", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("step 2: enable allowlist → unlisted transfer now fails", async () => {
      await updatePolicy(program, authority, fixture.mint.publicKey, { allowlistEnabled: true });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.SourceNotAllowlisted,
        "allowlist immediately active after runtime enable"
      );
    });

    it("step 3: adding to allowlist restores transfer", async () => {
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, true);

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

  // ── Vesting runtime toggle ─────────────────────────────────────────────────

  describe("Vesting: disabled → enabled at runtime", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
    });

    it("step 1: transfer succeeds with vesting disabled", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("step 2: enable vesting → future-locked vesting entry now blocks", async () => {
      // Set a future lock on the sender first
      const futureTs = Math.floor(Date.now() / 1000) + 86400;
      await setVestingLock(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, futureTs);

      // Then enable vesting
      await updatePolicy(program, authority, fixture.mint.publicKey, { vestingEnabled: true });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.TokensLocked,
        "vesting immediately active after runtime enable"
      );
    });
  });

  // ── Denylist runtime toggle ────────────────────────────────────────────────

  describe("Denylist: disabled → enabled at runtime", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
    });

    it("step 1: flagging sender while denylist is disabled has no effect on transfer", async () => {
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);

      // denylistEnabled is false — transfer should still succeed
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("step 2: enable denylist → flagged sender now blocked immediately", async () => {
      await updatePolicy(program, authority, fixture.mint.publicKey, { denylistEnabled: true });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.SourceDenylisted,
        "denylist immediately active after runtime enable, pre-existing flag respected"
      );
    });
  });

  // ── Cooldown runtime toggle ────────────────────────────────────────────────

  describe("Cooldown: disabled → enabled at runtime", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
    });

    it("step 1: transfer succeeds with cooldown disabled (no CooldownEntry needed)", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("step 2: enable cooldown → transfer blocked immediately (CooldownEntry missing)", async () => {
      await updatePolicy(program, authority, fixture.mint.publicKey, { cooldownSeconds: 60 });

      // No CooldownEntry was ever initialized
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.CooldownEntryMissing,
        "cooldown immediately active after runtime enable"
      );
    });

    it("step 3: initializing CooldownEntry restores ability to transfer", async () => {
      await initCooldownEntry(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount);

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
});
