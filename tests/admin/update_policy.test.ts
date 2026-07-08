/**
 * tests/admin/update_policy.test.ts
 *
 * Authorization, cross-field validation, and all bound checks for update_policy.
 * Error codes exercised: Unauthorized (6004), InvalidBps (6015),
 *                        InvalidTransferBounds (6020), CooldownTooLong (6022)
 */

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  createFundedUser,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";
import { updatePolicy, NULL_POLICY } from "../utils/fixtures";

describe("admin/update_policy", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("authorization: non-authority cannot call update_policy", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    const attacker = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .updatePolicy({ ...NULL_POLICY, paused: true } as any)
        .accounts({ policyAuthority: attacker.publicKey, mint: fixture.mint.publicKey })
        .signers([attacker])
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized
    );
  });

  it("all flags update correctly and persist", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await updatePolicy(program, authority, fixture.mint.publicKey, {
      paused: true,
      allowlistEnabled: true,
      vestingEnabled: true,
      denylistEnabled: true,
      maxTransferAmount: new (require("bn.js"))(500),
      minTransferAmount: new (require("bn.js"))(10),
      maxHolderBps: 2000,
      cooldownSeconds: 120,
    });

    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.paused).to.equal(true);
    expect(cfg.allowlistEnabled).to.equal(true);
    expect(cfg.vestingEnabled).to.equal(true);
    expect(cfg.denylistEnabled).to.equal(true);
    expect(cfg.maxTransferAmount.toString()).to.equal("500");
    expect(cfg.minTransferAmount.toString()).to.equal("10");
    expect(cfg.maxHolderBps).to.equal(2000);
    expect(cfg.cooldownSeconds).to.equal(120);
  });

  it("null fields leave stored values untouched (partial update)", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await updatePolicy(program, authority, fixture.mint.publicKey, { paused: true });

    // Only update cooldown — paused should still be true
    await updatePolicy(program, authority, fixture.mint.publicKey, { cooldownSeconds: 30 });

    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.paused).to.equal(true);
    expect(cfg.cooldownSeconds).to.equal(30);
  });

  it("bound: maxHolderBps = 10001 rejected with InvalidBps", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await expectJettyError(
      updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: 10001 }),
      E.InvalidBps
    );
  });

  it("bound: maxHolderBps = 10000 accepted", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await updatePolicy(program, authority, fixture.mint.publicKey, { maxHolderBps: 10000 });
    const cfg = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
    expect(cfg.maxHolderBps).to.equal(10000);
  });

  it("cross-field: min > max in same call rejected with InvalidTransferBounds", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await expectJettyError(
      updatePolicy(program, authority, fixture.mint.publicKey, {
        maxTransferAmount: new (require("bn.js"))(100),
        minTransferAmount: new (require("bn.js"))(200),
      }),
      E.InvalidTransferBounds
    );
  });

  it("cross-field: setting min > previously stored max is rejected (cross-call validation)", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await updatePolicy(program, authority, fixture.mint.publicKey, {
      maxTransferAmount: new (require("bn.js"))(100),
    });
    await expectJettyError(
      updatePolicy(program, authority, fixture.mint.publicKey, {
        minTransferAmount: new (require("bn.js"))(200),
      }),
      E.InvalidTransferBounds,
      "new min 200 violates stale max 100"
    );
  });

  it("bound: cooldownSeconds > 30 days rejected with CooldownTooLong", async () => {
    const fixture = await createHookFixture(program, 1_000n);
    await expectJettyError(
      updatePolicy(program, authority, fixture.mint.publicKey, { cooldownSeconds: 2_592_001 }),
      E.CooldownTooLong
    );
  });
});
