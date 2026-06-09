"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const index_1 = __importDefault(require("./index"));
async function demo() {
    const programId = new web3_js_1.PublicKey("11111111111111111111111111111111");
    const mint = new web3_js_1.PublicKey("22222222222222222222222222222222");
    const wallet = new web3_js_1.PublicKey("33333333333333333333333333333333");
    const [hookConfigPda] = index_1.default.deriveHookConfigPda(mint, programId);
    const [extraMetaPda] = index_1.default.deriveExtraAccountMetaListPda(mint, programId);
    const [allowlistPda] = index_1.default.deriveAllowlistEntryPda(mint, wallet, programId);
    console.log("hookConfigPda:", hookConfigPda.toBase58());
    console.log("extraMetaPda:", extraMetaPda.toBase58());
    console.log("allowlistPda:", allowlistPda.toBase58());
}
demo().catch(console.error);
