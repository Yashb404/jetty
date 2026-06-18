import * as anchor from "@anchor-lang/core";
import type { Jetty } from "../../target/types/jetty";

export function makeProvider(): anchor.AnchorProvider {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    anchor.AnchorProvider.env().wallet,
    { commitment: "confirmed", preflightCommitment: "confirmed" }
  );
  anchor.setProvider(provider);
  return provider;
}

export function makeProgram(provider: anchor.AnchorProvider): anchor.Program<Jetty> {
  return anchor.workspace.Jetty as anchor.Program<Jetty>;
}

export const JETTY_ERROR = {
  TransferPaused: 6000,
  ExceedsVolumeLimit: 6001,
  SourceNotAllowlisted: 6002,
  DestinationNotAllowlisted: 6003,
  Unauthorized: 6004,
  NotTransferring: 6005,
} as const;

export async function expectJettyError(
  promise: Promise<unknown>,
  code: number
): Promise<void> {
  const { expect } = await import("chai");
  const { extractErrorCode } = await import("./helpers");
  try {
    await promise;
    expect.fail(`Expected Jetty error ${code} but instruction succeeded`);
  } catch (error) {
    const actual = extractErrorCode(error);
    expect(actual, `Expected error ${code}, got ${actual}\n${String(error)}`).to.equal(code);
  }
}
