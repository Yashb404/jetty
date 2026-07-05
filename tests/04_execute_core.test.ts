import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { createHookFixture, getPayer, getTokenAmount, transferWithHook } from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("execute_core (transfer hook pause & guard)", function () {
  this.timeout(200_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── direct invocation guard ───────────────────────────────────────────────

  it("rejects direct invocation with NotTransferring", async () => {
    const fixture = await createHookFixture(program);

    await expectJettyError(
      program.methods
        .execute(new anchor.BN(1))
        .accounts({
          sourceTokenAccount: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destinationTokenAccount: fixture.destinationTokenAccount,
          authority,
        })
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.NotTransferring
    );
  });

  // ── pause policy ──────────────────────────────────────────────────────────

  it("rejects transfer when paused", async () => {
    const fixture = await createHookFixture(program);

    await program.methods
      .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
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
      JETTY_ERROR.TransferPaused
    );
  });

  it("allows transfer after pause is lifted", async () => {
    const fixture = await createHookFixture(program);

    await program.methods
      .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    await program.methods
      .updatePolicy({ paused: false, allowlistEnabled: null, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
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
