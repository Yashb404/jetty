import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";
import * as anchor from "@anchor-lang/core";

describe("Module 3: Receiver Balance Cap", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;
  const initialMintAmount = 10_000n; // 10,000 tokens total supply

  before(async () => {
    // We mint 10,000 tokens to the source account
    fixture = await createHookFixture(program, initialMintAmount);
  });

  it("fails to set invalid BPS (> 10000)", async () => {
    await expectJettyError(
      program.methods
        .updatePolicy({
          paused: null,
          allowlistEnabled: null,
          maxTransferAmount: null,
          vestingEnabled: null,
          minTransferAmount: null,
          maxHolderBps: 10001,
        })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.InvalidBps
    );
  });

  it("transfer succeeds when it brings receiver exactly to cap", async () => {
    // Set cap to 500 BPS (5%)
    // 5% of 10,000 = 500 tokens
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: 500,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Transfer exactly 500 tokens
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 500n,
      decimals: fixture.decimals,
    });
  });

  it("transfer fails when it brings receiver above cap", async () => {
    // Receiver already has 500. Cap is 500.
    // Transferring 1 more token should fail.
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 1n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.ExceedsHolderCap
    );
  });

  it("transfer succeeds when cap is 0 (inactive) regardless of percentage", async () => {
    // Disable cap
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: 0,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Transfer 9000 more (brings total to 9500, 95%)
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 9000n,
      decimals: fixture.decimals,
    });
  });
});
