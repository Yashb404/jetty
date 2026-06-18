import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./program";

export function deriveHookConfigPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveAllowlistEntryPda(mint: PublicKey, tokenAccount: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("allowlist"), mint.toBuffer(), tokenAccount.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveExtraAccountMetaListPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    PROGRAM_ID
  );
}
