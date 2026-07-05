import { expect } from "chai";
import { createHookFixture, createFundedUser, deriveHookConfigPda, getPayer } from "./utils/helpers";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";
import * as anchor from "@anchor-lang/core";

describe("assign_policy_authority", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("rotates policy_authority when both current and new authority sign", async () => {
    const fixture = await createHookFixture(program);
    const newAuthority = await createFundedUser(provider);
    const [hookConfigPda] = deriveHookConfigPda(fixture.mint.publicKey, program.programId);

    await program.methods
      .assignPolicyAuthority()
      .accounts({
        currentAuthority: authority,
        newAuthority: newAuthority.publicKey,
        mint: fixture.mint.publicKey,
      })
      .signers([newAuthority])
      .rpc({ commitment: "confirmed" });

    const cfg = await program.account.hookConfig.fetch(hookConfigPda, "confirmed");
    expect(cfg.policyAuthority.equals(newAuthority.publicKey)).to.equal(true);
  });

  it("new authority can call update_policy after rotation", async () => {
    const fixture = await createHookFixture(program);
    const newAuthority = await createFundedUser(provider);
    const [hookConfigPda] = deriveHookConfigPda(fixture.mint.publicKey, program.programId);

    await program.methods
      .assignPolicyAuthority()
      .accounts({
        currentAuthority: authority,
        newAuthority: newAuthority.publicKey,
        mint: fixture.mint.publicKey,
      })
      .signers([newAuthority])
      .rpc({ commitment: "confirmed" });

    // The new authority should now be able to mutate policy
    await program.methods
      .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
      .accounts({ policyAuthority: newAuthority.publicKey, mint: fixture.mint.publicKey })
      .signers([newAuthority])
      .rpc({ commitment: "confirmed" });

    const cfg = await program.account.hookConfig.fetch(hookConfigPda, "confirmed");
    expect(cfg.paused).to.equal(true);
  });

  it("old authority can no longer call update_policy after rotation", async () => {
    const fixture = await createHookFixture(program);
    const newAuthority = await createFundedUser(provider);

    await program.methods
      .assignPolicyAuthority()
      .accounts({
        currentAuthority: authority,
        newAuthority: newAuthority.publicKey,
        mint: fixture.mint.publicKey,
      })
      .signers([newAuthority])
      .rpc({ commitment: "confirmed" });

    await expectJettyError(
      program.methods
        .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null, vestingEnabled: null, minTransferAmount: null, maxHolderBps: null, denylistEnabled: null, cooldownSeconds: null })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.Unauthorized
    );
  });

  it("rejects rotation when wrong current authority signs", async () => {
    const fixture = await createHookFixture(program);
    const wrongCurrent = await createFundedUser(provider);
    const newAuthority = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: wrongCurrent.publicKey,
          newAuthority: newAuthority.publicKey,
          mint: fixture.mint.publicKey,
        })
        .signers([wrongCurrent, newAuthority])
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.Unauthorized
    );
  });

  it("rejects no-op rotation to the same key", async () => {
    const fixture = await createHookFixture(program);

    await expectJettyError(
      program.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: authority,
          newAuthority: authority,
          mint: fixture.mint.publicKey,
        })
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.Unauthorized
    );
  });
});
