import { PublicKey } from "@solana/web3.js";
import { deriveHookConfigPda, deriveExtraAccountMetaListPda, deriveAllowlistEntryPda } from "../index";

test('PDA derivation returns PublicKey and bump', () => {
  const programId = new PublicKey("11111111111111111111111111111111");
  const mint = new PublicKey("22222222222222222222222222222222");
  const wallet = new PublicKey("33333333333333333333333333333333");

  const [hookConfigPda, bump1] = deriveHookConfigPda(mint, programId);
  expect(hookConfigPda).toBeInstanceOf(PublicKey);
  expect(typeof bump1).toBe('number');

  const [extraMetaPda, bump2] = deriveExtraAccountMetaListPda(mint, programId);
  expect(extraMetaPda).toBeInstanceOf(PublicKey);
  expect(typeof bump2).toBe('number');

  const [allowlistPda, bump3] = deriveAllowlistEntryPda(mint, wallet, programId);
  expect(allowlistPda).toBeInstanceOf(PublicKey);
  expect(typeof bump3).toBe('number');
});
