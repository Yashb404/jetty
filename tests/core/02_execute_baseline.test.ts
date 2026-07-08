/**
 * tests/core/02_execute_baseline.test.ts
 *
 * Plain transfer with zero modules enabled. Verifies:
 * - Transfers succeed with the hook installed but all flags off.
 * - Balances change correctly.
 * - NotTransferring (6005) fires when execute is called outside a real transfer.
 *   NOTE: Direct invocation of execute is blocked by Anchor's discriminator
 *   check + the TransferHookAccount.transferring extension state check. We
 *   cannot easily construct a raw CPI call to test this without a custom
 *   harness, so we document this gap rather than silently skip it.
 */

import { expect } from "chai";
import {
  createHookFixture,
  getPayer,
  getTokenAmount,
  transferWithHook,
} from "../utils/helpers";
import { makeProvider, makeProgram } from "../utils/setup";

describe("core/execute_baseline", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);

  it("transfer succeeds with all modules disabled and balances change correctly", async () => {
    const fixture = await createHookFixture(program, 1_000n);

    await transferWithHook(provider, {
      source: fixture.sourceTokenAccount,
      mint: fixture.mint.publicKey,
      destination: fixture.destinationTokenAccount,
      owner: fixture.sourceOwner,
      amount: 100n,
      decimals: fixture.decimals,
    });

    expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(900n);
    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(100n);
  });

  it("multiple sequential transfers succeed with no modules enabled", async () => {
    const fixture = await createHookFixture(program, 1_000n);

    for (const amount of [50n, 100n, 200n]) {
      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: fixture.sourceOwner,
        amount,
        decimals: fixture.decimals,
      });
    }

    expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(650n);
    expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(350n);
  });

  // Gap: NotTransferring (E.6005) and InvalidAuthority (E.6009) require a
  // specially-constructed raw CPI outside a real Token-2022 transfer.
  // These are enforced by the program and documented in execute.rs but cannot
  // be triggered from the standard test harness without a custom attack program.
  // TODO: Add a standalone attack-program test once the test infra supports raw CPIs.
});
