import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { createHookFixture, getPayer, getTokenAmount, transferWithHook } from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("execute_max_transfer (volume limit)", function () {
  this.timeout(200_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── volume limit ──────────────────────────────────────────────────────────

  it("rejects transfer that exceeds the volume limit", async () => {
    const fixture = await createHookFixture(program);

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: null, maxTransferAmount: new anchor.BN(5), vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: authority,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.ExceedsVolumeLimit
    );
  });

  it("allows a transfer exactly at the volume limit", async () => {
    const fixture = await createHookFixture(program);

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: null, maxTransferAmount: new anchor.BN(10), vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: authority,
      amount: 10n,
      decimals: fixture.decimals,
    });

    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(10n);
  });
});
