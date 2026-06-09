import { PublicKey, TransactionInstruction } from "@solana/web3.js";
/**
 * Derive the HookConfig PDA for a given mint and program.
 */
export declare function deriveHookConfigPda(mint: PublicKey, programId: PublicKey): [PublicKey, number];
/**
 * Derive the ExtraAccountMetaList PDA for a given mint and program.
 */
export declare function deriveExtraAccountMetaListPda(mint: PublicKey, programId: PublicKey): [PublicKey, number];
/**
 * Derive the AllowlistEntry PDA for a given mint and wallet and program.
 */
export declare function deriveAllowlistEntryPda(mint: PublicKey, wallet: PublicKey, programId: PublicKey): [PublicKey, number];
/**
 * Given resolved PDAs, append them as "remaining accounts" to an existing instruction.
 * Many integrators will prefer to use their standard token transfer instruction then
 * append these PDAs so the Token-2022 transfer hook will include them.
 */
export declare function appendExtraAccounts(instruction: TransactionInstruction, extraAccountMetaList: PublicKey, senderAllowlist: PublicKey, receiverAllowlist: PublicKey): TransactionInstruction;
declare const _default: {
    deriveHookConfigPda: typeof deriveHookConfigPda;
    deriveExtraAccountMetaListPda: typeof deriveExtraAccountMetaListPda;
    deriveAllowlistEntryPda: typeof deriveAllowlistEntryPda;
    appendExtraAccounts: typeof appendExtraAccounts;
};
export default _default;
