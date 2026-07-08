/**
 * tests/utils/fixtures.ts
 *
 * Shared program-instruction helpers that build common operations used across
 * multiple test files. Centralizes all `program.methods.*` call patterns so
 * test files stay readable and don't duplicate account resolution logic.
 */

import * as anchor from "@anchor-lang/core";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type { Jetty } from "../../target/types/jetty";

type JettyProgram = anchor.Program<Jetty>;

// Null-filled args object for update_policy — spread and override only what you need.
export const NULL_POLICY = {
  paused: null,
  allowlistEnabled: null,
  maxTransferAmount: null,
  vestingEnabled: null,
  minTransferAmount: null,
  maxHolderBps: null,
  denylistEnabled: null,
  cooldownSeconds: null,
} as const;

// ---------------------------------------------------------------------------
// Policy management
// ---------------------------------------------------------------------------

export async function updatePolicy(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  patch: Partial<typeof NULL_POLICY>
): Promise<void> {
  await program.methods
    .updatePolicy({ ...NULL_POLICY, ...patch } as any)
    .accounts({ policyAuthority: authority, mint })
    .rpc({ commitment: "confirmed" });
}

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

export async function setAllowlist(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  active: boolean
): Promise<void> {
  await program.methods
    .updateAllowlist(active)
    .accounts({ payer: authority, policyAuthority: authority, mint, tokenAccount })
    .rpc({ commitment: "confirmed" });
}

// ---------------------------------------------------------------------------
// Denylist
// ---------------------------------------------------------------------------

export async function setDenylist(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  flagged: boolean
): Promise<void> {
  await program.methods
    .updateDenylist(flagged)
    .accounts({ payer: authority, mint, tokenAccount })
    .rpc({ commitment: "confirmed" });
}

// ---------------------------------------------------------------------------
// Vesting
// ---------------------------------------------------------------------------

export async function setVestingLock(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  unlockTimestamp: number
): Promise<void> {
  await program.methods
    .setVestingLock(new anchor.BN(unlockTimestamp))
    .accounts({ payer: authority, policyAuthority: authority, mint, tokenAccount })
    .rpc({ commitment: "confirmed" });
}

export async function clearVestingLock(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey
): Promise<void> {
  await program.methods
    .clearVestingLock()
    .accounts({ payer: authority, policyAuthority: authority, mint, tokenAccount })
    .rpc({ commitment: "confirmed" });
}

// ---------------------------------------------------------------------------
// Cooldown
// ---------------------------------------------------------------------------

export async function initCooldownEntry(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey
): Promise<void> {
  await program.methods
    .initCooldownEntry()
    .accounts({ payer: authority, mint, tokenAccount })
    .rpc({ commitment: "confirmed" });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export async function initHookConfig(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey
): Promise<void> {
  await program.methods
    .initializeHookConfig()
    .accounts({ payer: authority, policyAuthority: authority, mint })
    .rpc({ commitment: "confirmed" });
}

export async function initExtraAccountMetaList(
  program: JettyProgram,
  authority: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey
): Promise<void> {
  await program.methods
    .initExtraAccountMetaList()
    .accounts({
      payer: authority,
      policyAuthority: authority,
      mint,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc({ commitment: "confirmed" });
}
