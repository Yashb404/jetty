import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { createHookFixture, getPayer, getTokenAmount, transferWithHook } from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("execute_allowlist (transfer hook)", function () {
  this.timeout(200_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // Helper: allowlist a token account for a given mint.
  async function allowlist(
    mintPubkey: anchor.web3.PublicKey,
    tokenAccount: anchor.web3.PublicKey
  ): Promise<void> {
    await program.methods
      .updateAllowlist(true)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: mintPubkey,
        tokenAccount,
      })
      .rpc({ commitment: "confirmed" });
  }

  async function revoke(
    mintPubkey: anchor.web3.PublicKey,
    tokenAccount: anchor.web3.PublicKey
  ): Promise<void> {
    await program.methods
      .updateAllowlist(false)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: mintPubkey,
        tokenAccount,
      })
      .rpc({ commitment: "confirmed" });
  }

  // ── allowlist enforcement ─────────────────────────────────────────────────

  it("rejects transfer when sender token account is not allowlisted", async () => {
    const fixture = await createHookFixture(program);

    // Allowlist only the destination token account.
    await allowlist(fixture.mint.publicKey, fixture.destinationTokenAccount);

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
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
      JETTY_ERROR.SourceNotAllowlisted
    );
  });

  it("rejects transfer when receiver token account is not allowlisted", async () => {
    const fixture = await createHookFixture(program);

    // Allowlist only the source token account.
    await allowlist(fixture.mint.publicKey, fixture.sourceTokenAccount);

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
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
      JETTY_ERROR.DestinationNotAllowlisted
    );
  });

  it("allows transfer when both sender and receiver token accounts are allowlisted", async () => {
    const fixture = await createHookFixture(program);

    await allowlist(fixture.mint.publicKey, fixture.sourceTokenAccount);
    await allowlist(fixture.mint.publicKey, fixture.destinationTokenAccount);

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
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

    expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(990n);
    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(10n);
  });

  it("rejects transfer for a revoked sender token account entry", async () => {
    const fixture = await createHookFixture(program);

    // Allowlist both, then revoke the sender (closes the PDA).
    await allowlist(fixture.mint.publicKey, fixture.sourceTokenAccount);
    await allowlist(fixture.mint.publicKey, fixture.destinationTokenAccount);
    await revoke(fixture.mint.publicKey, fixture.sourceTokenAccount);

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
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
      JETTY_ERROR.SourceNotAllowlisted
    );
  });
});
