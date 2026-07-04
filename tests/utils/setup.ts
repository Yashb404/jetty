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
  MintMismatch: 6006,
  InvalidTokenProgram: 6007,
  InvalidMetaListOwner: 6008,
  InvalidAuthority: 6009,
  ExtraMetaListNotInitialized: 6010,
  MetaListSizeOverflow: 6011,
  TokensLocked: 6012,
  BelowMinimumTransferAmount: 6013,
  ExceedsHolderCap: 6014,
  InvalidBps: 6015,
  SourceDenylisted: 6016,
  DestinationDenylisted: 6017,
  CooldownNotExpired: 6018,
  CooldownEntryMissing: 6019,
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
    if (actual !== code) {
      console.log("ACTUAL ERROR:", actual, "EXPECTED:", code);
      if ((error as any).logs) console.log("LOGS:", (error as any).logs);
    }
    expect(actual, `Expected error ${code}, got ${actual}\n${String(error)}`).to.equal(code);
  }
}
