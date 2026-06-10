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
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
} from "@solana/spl-token";

import type { Jetty } from "../../target/types/jetty";

type JettyProgram = anchor.Program<Jetty>;

// The provider wallet as a keypair — only used where @solana/spl-token
// requires a raw Keypair (getOrCreateAssociatedTokenAccount, mintToChecked).
// Never used to derive a pubkey; use provider.wallet.publicKey for that.
function getWalletKeypair(provider: anchor.AnchorProvider): anchor.web3.Keypair {
  const wallet = provider.wallet as anchor.Wallet & { payer?: anchor.web3.Keypair };
  if (!wallet.payer) throw new Error("Provider wallet does not expose a payer keypair");
  return wallet.payer;
}

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

export const EXTRA_ACCOUNT_META_LIST_SIZE = 121;

export function getProvider(): anchor.AnchorProvider {
  return anchor.getProvider() as anchor.AnchorProvider;
}

// Returns the provider wallet's public key — the key Anchor uses to sign
// all .rpc() calls. Always consistent with what gets stored on-chain.
export function getPayer(provider: anchor.AnchorProvider): anchor.web3.PublicKey {
  return provider.wallet.publicKey;
}

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
  wallet: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("allowlist"), mint.toBuffer(), wallet.toBuffer()],
    programId
  );
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

// Creates a Token-2022 mint with a TransferHook extension pointing at programId.
// provider.sendAndConfirm signs with the provider wallet — consistent with
// provider.wallet.publicKey used everywhere else.
export async function createTransferHookMint(
  provider: anchor.AnchorProvider,
  transferHookProgramId: anchor.web3.PublicKey,
  decimals = 2
): Promise<anchor.web3.Keypair> {
  const payerPubkey = provider.wallet.publicKey;
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
      payerPubkey,
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

  await provider.sendAndConfirm(transaction, [mint]);
  return mint;
}

export async function getOrCreateToken2022Ata(
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> {
  const payer = getWalletKeypair(provider);
  const account = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    owner,
    false,
    "confirmed",
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );
  return account.address;
}

export async function mintToken2022To(
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  destination: anchor.web3.PublicKey,
  amount: bigint,
  decimals: number
): Promise<void> {
  const payer = getWalletKeypair(provider);
  await mintToChecked(
    provider.connection,
    payer,
    mint,
    destination,
    payer,
    amount,
    decimals,
    [],
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );
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
): Promise<void> {
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
  const tx = new anchor.web3.Transaction().add(instruction);
  await provider.sendAndConfirm(tx, []);
}

// Creates a full fixture: mint → HookConfig → ExtraAccountMetaList → ATAs → minted tokens.
// All authority accounts use provider.wallet.publicKey so they match what
// Anchor signs with in every subsequent .rpc() call.
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
    .accounts({
      payer: authority,
      policyAuthority: authority,
      mint: mint.publicKey,
    })
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

  const sourceTokenAccount = await getOrCreateToken2022Ata(
    provider,
    mint.publicKey,
    authority
  );

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