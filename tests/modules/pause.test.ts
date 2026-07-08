/**
 * tests/modules/pause.test.ts
 *
 * Global Pause module.
 * Error codes exercised: TransferPaused (6000), Unauthorized (6004)
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

describe("modules/pause", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);
  });

  it("happy path: transfer succeeds when paused = false", async () => {
    await updatePolicy(program, authority, fixture.mint.publicKey, { paused: false });

    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("negative: transfer fails with TransferPaused when paused = true", async () => {
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

    // Restore
    await updatePolicy(program, authority, fixture.mint.publicKey, { paused: false });
  });

  it("authorization: non-authority cannot pause the mint", async () => {
    const attacker = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null,
          vestingEnabled: null, minTransferAmount: null, maxHolderBps: null,
          denylistEnabled: null, cooldownSeconds: null })
        .accounts({ policyAuthority: attacker.publicKey, mint: fixture.mint.publicKey })
        .signers([attacker])
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized,
      "attacker cannot pause"
    );
  });
});
