import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export interface HookConfig {
  mint: PublicKey;
  policyAuthority: PublicKey;
  bump: number;
  paused: boolean;
  allowlistEnabled: boolean;
  maxTransferAmount: BN;
}

export interface AllowlistEntry {
  mint: PublicKey;
  wallet: PublicKey;
  active: boolean;
  bump: number;
}
