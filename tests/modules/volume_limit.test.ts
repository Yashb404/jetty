/**
 * tests/modules/volume_limit.test.ts
 *
 * Max + Min transfer amount. Both interact so they share a file.
 * Error codes exercised: ExceedsVolumeLimit (6001), BelowMinimumTransferAmount (6013),
 *                        InvalidTransferBounds (6020), Unauthorized (6004)
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

describe("modules/volume_limit", function () {
  this.timeout(180_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── max_transfer_amount ────────────────────────────────────────────────────

  describe("max_transfer_amount", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        maxTransferAmount: new (require("bn.js"))(100),
      });
    });

    it("happy path: transfer at exactly max_transfer_amount succeeds", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 100n,
        decimals: fixture.decimals,
      });
    });

    it("negative: transfer one unit above max_transfer_amount fails", async () => {
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 101n,
          decimals: fixture.decimals,
        }),
        E.ExceedsVolumeLimit,
        "101 > max 100"
      );
    });

    it("sentinel: max_transfer_amount = 0 disables the check entirely", async () => {
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        maxTransferAmount: new (require("bn.js"))(0),
      });

      // Any large amount should now pass
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 500n,
        decimals: fixture.decimals,
      });
    });
  });

  // ── min_transfer_amount ────────────────────────────────────────────────────

  describe("min_transfer_amount", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        minTransferAmount: new (require("bn.js"))(50),
      });
    });

    it("happy path: transfer at exactly min_transfer_amount succeeds", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 50n,
        decimals: fixture.decimals,
      });
    });

    it("negative: transfer one unit below min_transfer_amount fails", async () => {
      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 49n,
          decimals: fixture.decimals,
        }),
        E.BelowMinimumTransferAmount,
        "49 < min 50"
      );
    });

    it("sentinel: min_transfer_amount = 0 disables the check, allowing any size", async () => {
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        minTransferAmount: new (require("bn.js"))(0),
      });

      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 1n,
        decimals: fixture.decimals,
      });
    });

    it("edge: zero-value transfer is NOT blocked by min (min=0 is inactive)", async () => {
      // amount=0 with min=0 passes the min check (0 is excluded: `amount != 0` guard)
      // The Token program itself will reject it, but NOT our hook.
      // We just confirm our policy doesn't incorrectly block it.
      // NOTE: Token-2022 allows zero transfers — they're a no-op.
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 0n,
        decimals: fixture.decimals,
      });
    });
  });

  // ── cross-field validation: min ≤ max ─────────────────────────────────────

  describe("cross-field: min ≤ max validation", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
    });

    it("rejects min > max set in same call", async () => {
      await expectJettyError(
        updatePolicy(program, authority, fixture.mint.publicKey, {
          minTransferAmount: new (require("bn.js"))(200),
          maxTransferAmount: new (require("bn.js"))(100),
        }),
        E.InvalidTransferBounds,
        "min 200 > max 100 in same call"
      );
    });

    it("rejects min > already-stored max (cross-call validation)", async () => {
      // First: set max = 100
      await updatePolicy(program, authority, fixture.mint.publicKey, {
        maxTransferAmount: new (require("bn.js"))(100),
      });

      // Then: set min = 200 (cross-call violation — reads stale max from state)
      await expectJettyError(
        updatePolicy(program, authority, fixture.mint.publicKey, {
          minTransferAmount: new (require("bn.js"))(200),
        }),
        E.InvalidTransferBounds,
        "min 200 > stale max 100"
      );
    });

    it("authorization: non-authority cannot set volume limits", async () => {
      const attacker = await createFundedUser(provider);
      await expectJettyError(
        program.methods
          .updatePolicy({ paused: null, allowlistEnabled: null,
            maxTransferAmount: new (require("bn.js"))(1), vestingEnabled: null,
            minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
          .accounts({ policyAuthority: attacker.publicKey, mint: fixture.mint.publicKey })
          .signers([attacker])
          .rpc({ commitment: "confirmed" }),
        E.Unauthorized
      );
    });
  });
});
