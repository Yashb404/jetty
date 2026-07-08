/**
 * tests/modules/allowlist.test.ts
 *
 * Allowlist module — deny-by-default when enabled.
 * Error codes exercised: SourceNotAllowlisted (6002), DestinationNotAllowlisted (6003),
 *                        Unauthorized (6004)
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
import { updatePolicy, setAllowlist } from "../utils/fixtures";

describe("modules/allowlist", function () {
  this.timeout(180_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── deny-by-default when enabled ──────────────────────────────────────────

  describe("allowlist enforcement", () => {
    let fixture: any;

    before(async () => {
      fixture = await createHookFixture(program, 1_000n);
      await updatePolicy(program, authority, fixture.mint.publicKey, { allowlistEnabled: true });
    });

    it("negative: transfer fails when sender is not allowlisted", async () => {
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, true);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.SourceNotAllowlisted
      );
    });

    it("negative: transfer fails when receiver is not allowlisted", async () => {
      // Sender allowlisted, receiver not
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, true);
      // Revoke destination if it was set from previous test
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.destinationTokenAccount, false);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.DestinationNotAllowlisted
      );
    });

    it("happy path: transfer succeeds when both sides are allowlisted", async () => {
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

      expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(990n);
    });

    it("negative: revoked sender entry causes transfer to fail again", async () => {
      // Source is still allowlisted from previous test; revoke it
      await setAllowlist(program, authority, fixture.mint.publicKey, fixture.sourceTokenAccount, false);

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: fixture.sourceOwner,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        E.SourceNotAllowlisted
      );
    });
  });

  // ── disabled-state bypass ──────────────────────────────────────────────────

  it("disabled-state: transfer succeeds even when sender has no AllowlistEntry if module is off", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    // allowlistEnabled defaults to false — neither party allowlisted
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  // ── authorization ──────────────────────────────────────────────────────────

  it("authorization: non-authority cannot add to allowlist", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const attacker = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .updateAllowlist(true)
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
