/**
 * tests/admin/assign_policy_authority.test.ts
 *
 * The Handshake Rule — authority rotation requires BOTH current and new
 * authority to sign. Also guards against no-op rotation to self.
 * Error codes exercised: Unauthorized (6004), MintMismatch (6006)
 */

import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  createFundedUser,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";

describe("admin/assign_policy_authority", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("happy path: rotates policy authority when both old and new sign", async () => {
    const fixture = await createHookFixture(program, 1_000n);
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

    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.policyAuthority.equals(newAuthority.publicKey)).to.equal(true);
  });

  it("negative: fails when caller is not the current_authority", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const attacker = await createFundedUser(provider);
    const victim = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: attacker.publicKey,
          newAuthority: victim.publicKey,
          mint: fixture.mint.publicKey,
        })
        .signers([attacker, victim])
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized,
      "attacker is not current_authority"
    );
  });

  it("negative: no-op rotation to same key is rejected", async () => {
    const fixture = await createHookFixture(program, 1_000n);

    // require_keys_neq! fires Unauthorized (same code used for simplicity)
    await expectJettyError(
      program.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: authority,
          newAuthority: authority,
          mint: fixture.mint.publicKey,
        })
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized,
      "no-op rotation to self"
    );
  });

  it("after rotation: old authority can no longer call update_policy", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const newAuthority = await createFundedUser(provider);

    // Rotate
    await program.methods
      .assignPolicyAuthority()
      .accounts({
        currentAuthority: authority,
        newAuthority: newAuthority.publicKey,
        mint: fixture.mint.publicKey,
      })
      .signers([newAuthority])
      .rpc({ commitment: "confirmed" });

    // Old authority should now be rejected
    await expectJettyError(
      program.methods
        .updatePolicy({
          paused: true, allowlistEnabled: null, maxTransferAmount: null,
          vestingEnabled: null, minTransferAmount: null, maxHolderBps: null,
          denylistEnabled: null, cooldownSeconds: null,
        })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized,
      "old authority rejected after rotation"
    );
  });

  it("after rotation: new authority can successfully call update_policy", async () => {
    const fixture = await createHookFixture(program, 1_000n);
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

    // New authority should succeed
    await program.methods
      .updatePolicy({
        paused: true, allowlistEnabled: null, maxTransferAmount: null,
        vestingEnabled: null, minTransferAmount: null, maxHolderBps: null,
        denylistEnabled: null, cooldownSeconds: null,
      })
      .accounts({ policyAuthority: newAuthority.publicKey, mint: fixture.mint.publicKey })
      .signers([newAuthority])
      .rpc({ commitment: "confirmed" });

    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.paused).to.equal(true);
  });
});
