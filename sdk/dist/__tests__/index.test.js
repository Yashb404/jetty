"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const index_1 = require("../index");
test('PDA derivation returns PublicKey and bump', () => {
    const programId = new web3_js_1.PublicKey("11111111111111111111111111111111");
    const mint = new web3_js_1.PublicKey("22222222222222222222222222222222");
    const wallet = new web3_js_1.PublicKey("33333333333333333333333333333333");
    const [hookConfigPda, bump1] = (0, index_1.deriveHookConfigPda)(mint, programId);
    expect(hookConfigPda).toBeInstanceOf(web3_js_1.PublicKey);
    expect(typeof bump1).toBe('number');
    const [extraMetaPda, bump2] = (0, index_1.deriveExtraAccountMetaListPda)(mint, programId);
    expect(extraMetaPda).toBeInstanceOf(web3_js_1.PublicKey);
    expect(typeof bump2).toBe('number');
    const [allowlistPda, bump3] = (0, index_1.deriveAllowlistEntryPda)(mint, wallet, programId);
    expect(allowlistPda).toBeInstanceOf(web3_js_1.PublicKey);
    expect(typeof bump3).toBe('number');
});
