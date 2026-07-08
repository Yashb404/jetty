/**
 * tests/utils/helpers.ts
 *
 * Low-level transaction utilities and PDA derivation helpers.
 * All test files import from here — no copy-pasted PDA logic.
 */

import * as anchor from "@anchor-lang/core";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createTransferCheckedWithTransferHookInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMintLen,
} from "@solana/spl-token";
import type { Jetty } from "../../target/types/jetty";

type JettyProgram = anchor.Program<Jetty>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HookFixture = {
  mint: anchor.web3.Keypair;
  decimals: number;
  hookConfigPda: anchor.web3.PublicKey;
  hookConfigBump: number;
  extraAccountMetaListPda: anchor.web3.PublicKey;
  extraAccountMetaListBump: number;
  sourceOwner: anchor.web3.PublicKey;
  sourceTokenAccount: anchor.web3.PublicKey;
  destinationOwner: anchor.web3.Keypair;
  destinationTokenAccount: anchor.web3.PublicKey;
};

// ---------------------------------------------------------------------------
// ExtraAccountMetaList size calculation
// Header: 8-byte discriminator + 4-byte length + 4-byte count = 16 bytes
// Each ExtraAccountMeta: exactly 35 bytes
// ---------------------------------------------------------------------------
const EXTRA_ACCOUNT_META_LIST_HEADER_SIZE = 16;
const EXTRA_ACCOUNT_META_SIZE = 35;
// 1 HookConfig + 9 module PDAs (Allowlist×2, Vesting, Denylist×2, Cooldown, Exemption×2, Volume)
const NUM_EXTRA_ACCOUNTS = 10;
export const EXTRA_ACCOUNT_META_LIST_SIZE =
  EXTRA_ACCOUNT_META_LIST_HEADER_SIZE + NUM_EXTRA_ACCOUNTS * EXTRA_ACCOUNT_META_SIZE;

// ---------------------------------------------------------------------------
// Provider/wallet helpers
// ---------------------------------------------------------------------------

function getWalletKeypair(provider: anchor.AnchorProvider): anchor.web3.Keypair {
  const wallet = provider.wallet as anchor.Wallet & { payer?: anchor.web3.Keypair };
  if (!wallet.payer) throw new Error("Provider wallet does not expose a payer keypair");
  return wallet.payer;
}

export function getPayer(provider: anchor.AnchorProvider): anchor.web3.PublicKey {
  return provider.wallet.publicKey;
}

// ---------------------------------------------------------------------------
// PDA derivation — single source of truth for all seed derivations
// ---------------------------------------------------------------------------

export function deriveHookConfigPda(
  mint: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), mint.toBuffer()],
    programId
  );
}

export function deriveExtraAccountMetaListPda(
  mint: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    programId
  );
}

export function deriveAllowlistEntryPda(
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("allowlist"), mint.toBuffer(), tokenAccount.toBuffer()],
    programId
  );
}

export function deriveVestingEntryPda(
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vesting"), mint.toBuffer(), tokenAccount.toBuffer()],
    programId
  );
}

export function deriveDenylistEntryPda(
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("denylist"), mint.toBuffer(), tokenAccount.toBuffer()],
    programId
  );
}

export function deriveCooldownEntryPda(
  mint: anchor.web3.PublicKey,
  tokenAccount: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("cooldown"), mint.toBuffer(), tokenAccount.toBuffer()],
    programId
  );
}

// ---------------------------------------------------------------------------
// Transaction helpers
// ---------------------------------------------------------------------------

export async function sendAndConfirmWithRetry(
  provider: anchor.AnchorProvider,
  transaction: anchor.web3.Transaction,
  signers: anchor.web3.Signer[]
): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      const latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer =
        signers[0]?.publicKey ||
        (provider.wallet as any).payer?.publicKey ||
        provider.wallet.publicKey;
      await provider.sendAndConfirm(transaction, signers, { commitment: "confirmed" });
      return;
    } catch (err: any) {
      if (err.message && err.message.includes("Blockhash not found")) {
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Transaction failed after retries due to blockhash issues.");
}

export async function createFundedUser(
  provider: anchor.AnchorProvider,
  lamports = 2_000_000_000
): Promise<anchor.web3.Keypair> {
  const user = anchor.web3.Keypair.generate();
  const signature = await provider.connection.requestAirdrop(user.publicKey, lamports);
  const latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
  await provider.connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed"
  );
  return user;
}

export async function createTransferHookMint(
  provider: anchor.AnchorProvider,
  transferHookProgramId: anchor.web3.PublicKey,
  decimals = 2,
  customTransferHookAuthority?: anchor.web3.PublicKey
): Promise<anchor.web3.Keypair> {
  const payerPubkey = provider.wallet.publicKey;

  try {
    const sig = await provider.connection.requestAirdrop(payerPubkey, 10_000_000_000);
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
  } catch {
    // Already funded — ignore.
  }

  const transferHookAuth = customTransferHookAuthority ?? payerPubkey;
  const mint = anchor.web3.Keypair.generate();
  const mintSpace = getMintLen([ExtensionType.TransferHook]);
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: payerPubkey,
      newAccountPubkey: mint.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferHookInstruction(
      mint.publicKey,
      transferHookAuth,
      transferHookProgramId,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      payerPubkey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const payer = getWalletKeypair(provider);
  await sendAndConfirmWithRetry(provider, transaction, [payer, mint]);
  return mint;
}

export async function getOrCreateToken2022Ata(
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> {
  const payer = getWalletKeypair(provider);
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);

  const info = await provider.connection.getAccountInfo(ata, "confirmed");
  if (info) return ata;

  const { createAssociatedTokenAccountInstruction } = require("@solana/spl-token");
  const instruction = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID
  );

  const transaction = new anchor.web3.Transaction().add(instruction);
  await sendAndConfirmWithRetry(provider, transaction, [payer]);
  return ata;
}

export async function mintToken2022To(
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  destination: anchor.web3.PublicKey,
  amount: bigint,
  decimals: number
): Promise<void> {
  const payer = getWalletKeypair(provider);
  const { createMintToCheckedInstruction } = require("@solana/spl-token");

  const instruction = createMintToCheckedInstruction(
    mint,
    destination,
    payer.publicKey,
    amount,
    decimals,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  const transaction = new anchor.web3.Transaction().add(instruction);
  await sendAndConfirmWithRetry(provider, transaction, [payer]);
}

export async function transferWithHook(
  provider: anchor.AnchorProvider,
  params: {
    source: anchor.web3.PublicKey;
    mint: anchor.web3.PublicKey;
    destination: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    amount: bigint;
    decimals: number;
  }
): Promise<anchor.web3.TransactionSignature> {
  const instruction = await createTransferCheckedWithTransferHookInstruction(
    provider.connection,
    params.source,
    params.mint,
    params.destination,
    params.owner,
    params.amount,
    params.decimals,
    [],
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  const transaction = new anchor.web3.Transaction().add(instruction);
  const payer = getWalletKeypair(provider);

  // Use sendAndConfirm directly to get the tx signature for log inspection.
  const latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.feePayer = payer.publicKey;

  return provider.sendAndConfirm(transaction, [payer], { commitment: "confirmed" });
}

/**
 * transferWithHookAndLogs: same as transferWithHook but also returns the
 * program logs. Used by the account-index integrity test.
 */
export async function transferWithHookAndLogs(
  provider: anchor.AnchorProvider,
  params: {
    source: anchor.web3.PublicKey;
    mint: anchor.web3.PublicKey;
    destination: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    amount: bigint;
    decimals: number;
  }
): Promise<{ sig: string; logs: string[] }> {
  const sig = await transferWithHook(provider, params);
  const tx = await provider.connection.getTransaction(sig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  const logs = tx?.meta?.logMessages ?? [];
  return { sig, logs };
}

// ---------------------------------------------------------------------------
// createHookFixture — canonical fixture factory
// ---------------------------------------------------------------------------

export async function createHookFixture(
  program: JettyProgram,
  initialAmount = 1_000n
): Promise<HookFixture> {
  const provider = program.provider as anchor.AnchorProvider;
  const authority = provider.wallet.publicKey;

  const mint = await createTransferHookMint(provider, program.programId);

  const [hookConfigPda, hookConfigBump] = deriveHookConfigPda(mint.publicKey, program.programId);
  const [extraAccountMetaListPda, extraAccountMetaListBump] = deriveExtraAccountMetaListPda(
    mint.publicKey,
    program.programId
  );

  await program.methods
    .initializeHookConfig()
    .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });

  await program.methods
    .initExtraAccountMetaList()
    .accounts({
      payer: authority,
      policyAuthority: authority,
      mint: mint.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc({ commitment: "confirmed" });

  const sourceTokenAccount = await getOrCreateToken2022Ata(provider, mint.publicKey, authority);
  const destinationOwner = await createFundedUser(provider);
  const destinationTokenAccount = await getOrCreateToken2022Ata(
    provider,
    mint.publicKey,
    destinationOwner.publicKey
  );

  await mintToken2022To(provider, mint.publicKey, sourceTokenAccount, initialAmount, 2);

  return {
    mint,
    decimals: 2,
    hookConfigPda,
    hookConfigBump,
    extraAccountMetaListPda,
    extraAccountMetaListBump,
    sourceOwner: authority,
    sourceTokenAccount,
    destinationOwner,
    destinationTokenAccount,
  };
}

// ---------------------------------------------------------------------------
// Token balance helper
// ---------------------------------------------------------------------------

export async function getTokenAmount(
  provider: anchor.AnchorProvider,
  tokenAccount: anchor.web3.PublicKey
): Promise<bigint> {
  const account = await getAccount(
    provider.connection,
    tokenAccount,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  return account.amount;
}

export function expectedAta(
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey
): anchor.web3.PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
}

// ---------------------------------------------------------------------------
// Error extraction — handles all Anchor error formats
// ---------------------------------------------------------------------------

export function extractErrorCode(error: unknown): number | null {
  const candidate = error as {
    error?: { errorCode?: { number?: number } };
    code?: number;
    logs?: string[];
    message?: string;
  };

  if (candidate.error?.errorCode?.number !== undefined) {
    return candidate.error.errorCode.number;
  }

  if (candidate.code !== undefined && candidate.code >= 6000) {
    return candidate.code;
  }

  if (candidate.logs) {
    const parsed = anchor.AnchorError.parse(candidate.logs);
    if (parsed) return parsed.error.errorCode.number;
  }

  if (candidate.message && typeof candidate.message === "string") {
    const m = candidate.message.match(/custom program error: 0x([0-9a-fA-F]+)/);
    if (m) {
      const parsed = parseInt(m[1], 16);
      if (!Number.isNaN(parsed)) {
        if (parsed >= 6000) return parsed;
        if (parsed > 0) return parsed + 6000;
        return parsed;
      }
    }
  }

  return null;
}