import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export interface HookConfig {
  mint: PublicKey;
  policyAuthority: PublicKey;
  bump: number;
  paused: boolean;
  allowlistEnabled: boolean;
  maxTransferAmount: BN;
  vestingEnabled: boolean;
  minTransferAmount: BN;
  maxHolderBps: number;
  denylistEnabled: boolean;
  cooldownSeconds: number;
}

export interface AllowlistEntry {
  mint: PublicKey;
  tokenAccount: PublicKey;
  active: boolean;
  bump: number;
}
