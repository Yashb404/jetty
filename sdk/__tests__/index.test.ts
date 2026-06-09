import { test, expect } from '@jest/globals';
import { PublicKey, Keypair } from "@solana/web3.js";
import { deriveHookConfigPda, deriveExtraAccountMetaListPda, deriveAllowlistEntryPda } from "../index";

test('PDA derivation returns PublicKey and bump', () => {
  // Generate mathematically valid random public keys for testing
  const programId = Keypair.generate().publicKey;
  const mint = Keypair.generate().publicKey;
  const wallet = Keypair.generate().publicKey;

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