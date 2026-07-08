/**
 * tests/modules/denylist.test.ts
 *
 * Denylist module — allow-by-default, only blocks explicitly flagged entries.
 * Error codes exercised: SourceDenylisted (6016), DestinationDenylisted (6017),
 *                        Unauthorized (6004)
 */

import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
  createFundedUser,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";
import { updatePolicy, setDenylist } from "../utils/fixtures";

describe("modules/denylist", function () {
  this.timeout(180_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── enforcement ────────────────────────────────────────────────────────────

  describe("denylist enforcement", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, { denylistEnabled: true });
    });

    it("happy path: transfer succeeds when neither party is denylisted", async () => {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      });
    });

    it("negative: transfer fails with SourceDenylisted when sender is flagged", async () => {
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

      // Unflag
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);
    });

    it("negative: transfer fails with DestinationDenylisted when receiver is flagged", async () => {
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, true);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.DestinationDenylisted
      );

      // Unflag
      await setDenylist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, false);
    });

    it("transfer succeeds after unflagging both parties", async () => {
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

  it("disabled-state: flagged entry does not block transfer when denylist is off", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    // Create the denylist entry while the module is disabled (default)
    await setDenylist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);

    // denylistEnabled is still false by default
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  // ── authorization ─────────────────────────────────────────────────────────

  it("authorization: non-authority cannot flag a wallet on the denylist", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const attacker = await createFundedUser(provider);

    // policyAuthority MUST be explicit — omitting it causes Anchor to fall back to
    // the provider wallet (the real authority), which would make the call succeed
    // as the actual authority rather than testing the attacker path.
    await expectJettyError(
      program.methods
        .updateDenylist(true)
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
});
