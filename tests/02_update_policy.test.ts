import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { createHookFixture, createFundedUser, getPayer } from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("update_policy", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("updates all fields when all args are provided", async () => {
    const fixture = await createHookFixture(program);

    await program.methods
      .updatePolicy({ paused: true, allowlistEnabled: true, maxTransferAmount: new anchor.BN(25) })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.paused).to.equal(true);
    expect(cfg.allowlistEnabled).to.equal(true);
    expect(cfg.maxTransferAmount.toString()).to.equal("25");
  });

  it("leaves unchanged fields intact when args are null", async () => {
    const fixture = await createHookFixture(program);

    // Set a known baseline
    await program.methods
      .updatePolicy({ paused: false, allowlistEnabled: false, maxTransferAmount: new anchor.BN(100) })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Only change paused — everything else must stay as-is
    await program.methods
      .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.paused).to.equal(true);
    expect(cfg.allowlistEnabled).to.equal(false, "allowlistEnabled must not change");
    expect(cfg.maxTransferAmount.toString()).to.equal("100", "maxTransferAmount must not change");
  });

  it("setting maxTransferAmount to 0 deactivates the volume check", async () => {
    const { transferWithHook, getTokenAmount } = await import("./utils/helpers");
    const fixture = await createHookFixture(program);

    // Enable a limit, then clear it
    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: null, maxTransferAmount: new anchor.BN(5) })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    await program.methods
      .updatePolicy({ paused: null, allowlistEnabled: null, maxTransferAmount: new anchor.BN(0) })
      .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // A transfer of 10 (which was above the old cap) must now succeed
    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: authority,
      amount: 10n,
      decimals: fixture.decimals,
    });

    expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(990n);
  });

  it("rejects update_policy from wrong authority", async () => {
    const fixture = await createHookFixture(program);
    const wrongAuthority = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null })
        .accounts({ policyAuthority: wrongAuthority.publicKey, mint: fixture.mint.publicKey })
        .signers([wrongAuthority])
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.Unauthorized
    );
  });
});
