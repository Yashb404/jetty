import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  transferWithHook,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";
import * as anchor from "@anchor-lang/core";

describe("Module 5: Transfer Cooldown (Velocity limit)", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  let fixture: any;

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);
  });

  it("fails transfer if cooldown is enabled but PDA is missing", async () => {
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: null,
        cooldownSeconds: 60, // 60 seconds
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // The sender has not initialized their CooldownEntry
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.CooldownEntryMissing
    );
  });

  it("initializes CooldownEntry correctly", async () => {
    await program.methods
      .initCooldownEntry()
      .accounts({
        payer: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    const [cooldownPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cooldown"), fixture.mint.publicKey.toBuffer(), fixture.sourceTokenAccount.toBuffer()],
      program.programId
    );
    console.log("EXPECTED COOLDOWN PDA:", cooldownPda.toBase58());

    // PDA should now exist

    const data = await program.account.cooldownEntry.fetch(cooldownPda, "confirmed");
    expect(data.lastTransferTimestamp.toNumber()).to.equal(0);
  });

  it("first transfer succeeds and mutates the timestamp", async () => {
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });

    const [cooldownPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cooldown"), fixture.mint.publicKey.toBuffer(), fixture.sourceTokenAccount.toBuffer()],
      program.programId
    );

    const data = await program.account.cooldownEntry.fetch(cooldownPda, "confirmed");
    // Explicit on-chain state assertion
    expect(data.lastTransferTimestamp.toNumber()).to.be.greaterThan(0);
  });

  it("immediate second transfer fails", async () => {
    // Should fail because 60 seconds haven't passed
    await expectJettyError(
      transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount: 10n,
        decimals: fixture.decimals,
      }),
      JETTY_ERROR.CooldownNotExpired
    );
  });

  it("transfer succeeds if cooldown is globally disabled", async () => {
    // Disable cooldown globally
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: null,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: null,
        cooldownSeconds: 0,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Should succeed because cooldown is disabled
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
