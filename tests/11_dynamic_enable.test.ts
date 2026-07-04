import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("Module Integration: Dynamic Enable", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);
  });

  it("can initialize with a feature disabled, transfer, then enable it and enforce it", async () => {
    // 1. Initial transfer (no denylist) - should succeed
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });

    // 2. Enable denylist feature
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: true,
        cooldownSeconds: null,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // 3. Flag the sender
    await program.methods
      .updateDenylist(true)
      .accounts({
        payer: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    // 4. Try transfer again - should now fail because feature is enabled and sender is flagged
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
  });
});
