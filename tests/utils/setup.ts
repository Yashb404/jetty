/**
 * tests/utils/setup.ts
 *
 * Shared Anchor provider/program construction and the canonical error-code
 * registry. Every error code in programs/jetty/src/error.rs must have a
 * matching entry here so test assertions use named constants instead of magic
 * numbers. Keep this list in sync with error.rs — it is the ground truth for
 * the error-code coverage checklist.
 *
 * Error ordinals are 6000 + variant_index (Anchor convention).
 */

import * as anchor from "@anchor-lang/core";
import type { Jetty } from "../../target/types/jetty";
import { extractErrorCode } from "./helpers";

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

// ---------------------------------------------------------------------------
// Canonical error code registry — MUST stay in sync with error.rs
// ---------------------------------------------------------------------------
export const E = {
  TransferPaused:               6000,
  ExceedsVolumeLimit:           6001,
  SourceNotAllowlisted:         6002,
  DestinationNotAllowlisted:    6003,
  Unauthorized:                 6004,
  NotTransferring:              6005,
  MintMismatch:                 6006,
  InvalidTokenProgram:          6007,
  InvalidMetaListOwner:         6008,
  InvalidAuthority:             6009,
  ExtraMetaListNotInitialized:  6010,
  MetaListSizeOverflow:         6011,
  TokensLocked:                 6012,
  BelowMinimumTransferAmount:   6013,
  ExceedsHolderCap:             6014,
  InvalidBps:                   6015,
  SourceDenylisted:             6016,
  DestinationDenylisted:        6017,
  CooldownNotExpired:           6018,
  CooldownEntryMissing:         6019,
  InvalidTransferBounds:        6020,
  MathOverflow:                 6021,
  CooldownTooLong:              6022,
} as const;

// Legacy alias used by older test files — do not add new usages, prefer E.
export const JETTY_ERROR = E;

// ---------------------------------------------------------------------------
// expectJettyError — assert a tx fails with a specific Jetty error code
// ---------------------------------------------------------------------------
export async function expectJettyError(
  promise: Promise<unknown>,
  code: number,
  label?: string
): Promise<void> {
  const { expect } = await import("chai");
  try {
    await promise;
    expect.fail(`Expected Jetty error ${code}${label ? ` (${label})` : ""} but instruction succeeded`);
  } catch (error) {
    const actual = extractErrorCode(error);
    if (actual !== code) {
      console.log("ACTUAL ERROR:", actual, "EXPECTED:", code, label ?? "");
      if ((error as any).logs) console.log("LOGS:", (error as any).logs);
    }
    expect(
      actual,
      `Expected error ${code}${label ? ` (${label})` : ""}, got ${actual}\n${String(error)}`
    ).to.equal(code);
  }
}
