import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";
import * as anchor from "@anchor-lang/core";

describe("Module 4: Denylist / Blocklist", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);
  });

  it("transfer succeeds by default when Denylist is enabled but no PDA exists", async () => {
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: true,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Should succeed because neither sender nor receiver has a Denylist PDA
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("transfer fails if sender is denylisted", async () => {
    // Flag the sender
    await program.methods
      .updateDenylist(true)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

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

  it("transfer fails if receiver is denylisted", async () => {
    // Unflag sender so that doesn't trigger the failure
    await program.methods
      .updateDenylist(false)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    // Flag the receiver
    await program.methods
      .updateDenylist(true)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.destinationTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.DestinationDenylisted
    );
  });

  it("transfer succeeds if denylist is disabled globally (even if wallets are flagged)", async () => {
    // Disable denylist globally
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: false,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Receiver is still technically flagged, but globally disabled so it should pass
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("transfer succeeds if flagged = false on an existing PDA", async () => {
    // Re-enable global denylist
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: true,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Unflag the receiver
    await program.methods
      .updateDenylist(false)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.destinationTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    // Both PDAs exist, but both have flagged = false. Should pass.
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
