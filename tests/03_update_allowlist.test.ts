import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  createHookFixture,
  createFundedUser,
  deriveAllowlistEntryPda,
  getPayer,
  expectedAta,
  getOrCreateToken2022Ata,
} from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("update_allowlist", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("creates an AllowlistEntry seeded by token account with active=true", async () => {
    const fixture = await createHookFixture(program);
    // Derive the PDA using the destination TOKEN ACCOUNT, not the wallet owner.
    const [pda, bump] = deriveAllowlistEntryPda(
      fixture.mint.publicKey,
      fixture.destinationTokenAccount,
      program.programId
    );

    await program.methods
      .updateAllowlist(true)
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: fixture.mint.publicKey,
        tokenAccount: fixture.destinationTokenAccount,
      })
      .rpc({ commitment: "confirmed" });

    const entry = await program.account.allowlistEntry.fetch(pda, "confirmed");
    expect(entry.mint.equals(fixture.mint.publicKey)).to.equal(true);
    expect(entry.tokenAccount.equals(fixture.destinationTokenAccount)).to.equal(true);
    expect(entry.active).to.equal(true);
    expect(entry.bump).to.equal(bump);
  });

  it("closes the PDA (rent recovered) when called with active=false", async () => {
    const fixture = await createHookFixture(program);
    const [pda] = deriveAllowlistEntryPda(
      fixture.mint.publicKey,
      fixture.destinationTokenAccount,
      program.programId
    );
    const base = {
      payer: authority,
      policyAuthority: authority,
      mint: fixture.mint.publicKey,
      tokenAccount: fixture.destinationTokenAccount,
    };

    // Activate — PDA is created.
    await program.methods.updateAllowlist(true).accounts(base).rpc({ commitment: "confirmed" });

    const payerBefore = await provider.connection.getBalance(authority, "confirmed");

    // Revoke — PDA must be closed.
    await program.methods.updateAllowlist(false).accounts(base).rpc({ commitment: "confirmed" });

    const payerAfter = await provider.connection.getBalance(authority, "confirmed");

    // The account must no longer exist.
    const info = await provider.connection.getAccountInfo(pda, "confirmed");
    expect(info, "PDA should be closed after revocation").to.equal(null);

    // Payer should have recovered most of the rent (minus tx fee).
    expect(payerAfter).to.be.greaterThan(payerBefore - 10_000, "Rent should be recovered");
  });

  it("allows re-activation by recreating a closed entry", async () => {
    const fixture = await createHookFixture(program);
    const [pda] = deriveAllowlistEntryPda(
      fixture.mint.publicKey,
      fixture.destinationTokenAccount,
      program.programId
    );
    const base = {
      payer: authority,
      policyAuthority: authority,
      mint: fixture.mint.publicKey,
      tokenAccount: fixture.destinationTokenAccount,
    };

    // Activate → Revoke (closes PDA) → Re-activate (recreates PDA).
    await program.methods.updateAllowlist(true).accounts(base).rpc({ commitment: "confirmed" });
    await program.methods.updateAllowlist(false).accounts(base).rpc({ commitment: "confirmed" });
    await program.methods.updateAllowlist(true).accounts(base).rpc({ commitment: "confirmed" });

    const entry = await program.account.allowlistEntry.fetch(pda, "confirmed");
    expect(entry.active).to.equal(true);
    expect(entry.tokenAccount.equals(fixture.destinationTokenAccount)).to.equal(true);
  });

  it("rejects update_allowlist from wrong authority", async () => {
    const fixture = await createHookFixture(program);
    const wrongAuthority = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .updateAllowlist(true)
        .accounts({
          payer: authority,
          policyAuthority: wrongAuthority.publicKey,
          mint: fixture.mint.publicKey,
          tokenAccount: fixture.destinationTokenAccount,
        })
        .signers([wrongAuthority])
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.Unauthorized
    );
  });
});
