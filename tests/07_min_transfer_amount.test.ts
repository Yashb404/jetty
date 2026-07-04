import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";
import * as anchor from "@anchor-lang/core";

describe("Module 2: Minimum Transfer Amount (anti-dust)", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);
  });

  it("transfer fails if amount < min_transfer_amount", async () => {
    // Set min_transfer_amount to 10
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: new anchor.BN(10),
        maxHolderBps: null,
        denylistEnabled: null,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Attempt to transfer 5 (fails)
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 5n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.BelowMinimumTransferAmount
    );
  });

  it("transfer succeeds if amount == min_transfer_amount", async () => {
    // Attempt to transfer exactly 10
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("transfer succeeds if amount > min_transfer_amount", async () => {
    // Attempt to transfer 15
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 15n,
      decimals: fixture.decimals,
    });
  });

  it("transfer succeeds if amount == 0 (anti-griefing/closure bypass)", async () => {
    // Transfers of exactly 0 are inherently not wash-trading of actual assets
    // and Token-2022 uses 0-amount transfers internally when closing accounts or doing specific operations.
    // Ensure we don't break those by rejecting 0.
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
