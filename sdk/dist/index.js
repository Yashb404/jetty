"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveHookConfigPda = deriveHookConfigPda;
exports.deriveExtraAccountMetaListPda = deriveExtraAccountMetaListPda;
exports.deriveAllowlistEntryPda = deriveAllowlistEntryPda;
exports.appendExtraAccounts = appendExtraAccounts;
const web3_js_1 = require("@solana/web3.js");
const buffer_1 = require("buffer");
/**
 * Derive the HookConfig PDA for a given mint and program.
 */
function deriveHookConfigPda(mint, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([buffer_1.Buffer.from("policy"), mint.toBuffer()], programId);
}
/**
 * Derive the ExtraAccountMetaList PDA for a given mint and program.
 */
function deriveExtraAccountMetaListPda(mint, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([buffer_1.Buffer.from("extra-account-metas"), mint.toBuffer()], programId);
}
/**
 * Derive the AllowlistEntry PDA for a given mint and wallet and program.
 */
function deriveAllowlistEntryPda(mint, wallet, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([buffer_1.Buffer.from("allowlist"), mint.toBuffer(), wallet.toBuffer()], programId);
}
/**
 * Given resolved PDAs, append them as "remaining accounts" to an existing instruction.
 * Many integrators will prefer to use their standard token transfer instruction then
 * append these PDAs so the Token-2022 transfer hook will include them.
 */
function appendExtraAccounts(instruction, extraAccountMetaList, senderAllowlist, receiverAllowlist) {
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
exports.default = {
    deriveHookConfigPda,
    deriveExtraAccountMetaListPda,
    deriveAllowlistEntryPda,
    appendExtraAccounts,
};
