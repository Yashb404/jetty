import { PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * Derive the HookConfig PDA for a given mint and program.
 */
export function deriveHookConfigPda(mint: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("policy"), mint.toBuffer()], programId);
}

/**
 * Derive the ExtraAccountMetaList PDA for a given mint and program.
 */
export function deriveExtraAccountMetaListPda(mint: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), mint.toBuffer()], programId);
}

/**
 * Derive the AllowlistEntry PDA for a given mint and wallet and program.
 */
export function deriveAllowlistEntryPda(mint: PublicKey, wallet: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("allowlist"), mint.toBuffer(), wallet.toBuffer()], programId);
}

/**
 * Given resolved PDAs, append them as "remaining accounts" to an existing instruction.
 * Many integrators will prefer to use their standard token transfer instruction then
 * append these PDAs so the Token-2022 transfer hook will include them.
 */
export function appendExtraAccounts(
  instruction: TransactionInstruction,
  extraAccountMetaList: PublicKey,
  senderAllowlist: PublicKey,
  receiverAllowlist: PublicKey
): TransactionInstruction {
  // Safely append account metas to the instruction's keys array. Consumers
  // should ensure ordering matches expectations of Token-2022 transfer-hook
  // account resolution (extra-account-meta-list first, then sender and receiver).
  // @ts-ignore - extend internal keys for convenience in SDK helper
  instruction.keys = instruction.keys.concat([
    { pubkey: extraAccountMetaList, isSigner: false, isWritable: false },
    { pubkey: senderAllowlist, isSigner: false, isWritable: false },
    { pubkey: receiverAllowlist, isSigner: false, isWritable: false },
  ]);
  return instruction;
}

export default {
  deriveHookConfigPda,
  deriveExtraAccountMetaListPda,
  deriveAllowlistEntryPda,
  appendExtraAccounts,
};
