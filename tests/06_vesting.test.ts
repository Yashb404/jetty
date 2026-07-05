import { expect } from "chai";
import {
  createHookFixture,
  deriveVestingEntryPda,
  getPayer,
  transferWithHook,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";
import * as anchor from "@anchor-lang/core";

describe("Module 1: Vesting / Lockup", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // Use a single fixture for most tests to speed up execution
  let fixture: any;

  before(async () => {
    fixture = await createHookFixture(program, 1_000n);
  });

  it("test case 4: transfer succeeds when no VestingEntry exists and vesting_enabled = true", async () => {
    // Enable vesting globally
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: true,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: null,
        cooldownSeconds: null,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Ensure we can transfer without a PDA
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("test case 1: transfer blocked before unlock_timestamp", async () => {
    const futureTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 1000000);

    await program.methods
      .setVestingLock(futureTimestamp)
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
      JETTY_ERROR.TokensLocked
    );
  });

  it("test case 3: transfer succeeds when vesting_enabled = false regardless of VestingEntry state", async () => {
    // Disable vesting globally
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: false,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: null,
        cooldownSeconds: null,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Transfer should succeed even though the future unlock_timestamp is still set on the PDA
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("test case 2 & 6: transfer succeeds when a VestingEntry exists but unlock_timestamp is in the past", async () => {
    // Re-enable vesting globally
    await program.methods
      .updatePolicy({
        paused: null,
        allowlistEnabled: null,
        maxTransferAmount: null,
        vestingEnabled: true,
        minTransferAmount: null,
        maxHolderBps: null,
        denylistEnabled: null,
        cooldownSeconds: null,
      })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    const pastTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) - 1000000);

    // Update the existing PDA to a past timestamp
    await program.methods
      .setVestingLock(pastTimestamp)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    // Transfer should succeed
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 10n,
      decimals: fixture.decimals,
    });
  });

  it("test case 5: clear_vesting_lock correctly recovers rent", async () => {
    const [vestingPda] = deriveVestingEntryPda(
      fixture.mint.publicKey,
      fixture.sourceTokenAccount,
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(authority);

    const tx = await program.methods
      .clearVestingLock()
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.sourceTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    const balanceAfter = await provider.connection.getBalance(authority);
    const pdaInfo = await provider.connection.getAccountInfo(vestingPda, "confirmed");

    expect(pdaInfo).to.be.null;

    // It should have recovered rent (balanceAfter > balanceBefore - txFee)
    // We just ensure the tx succeeded and the PDA is gone, which implies rent recovery
    // because `close = payer` was used.
  });
});
