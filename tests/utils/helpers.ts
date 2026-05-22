import * as anchor from "@anchor-lang/core";
import {
  fromLegacyKeypair,
  fromLegacyTransactionInstruction,
} from "@solana/compat";
import {
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
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
type LocalWallet = anchor.Wallet & { payer: anchor.web3.Keypair };

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

export function getPayer(provider: anchor.AnchorProvider): anchor.web3.Keypair {
  return (provider.wallet as LocalWallet).payer;
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
  lamports = 1_000_000_000
): Promise<anchor.web3.Keypair> {
  const user = anchor.web3.Keypair.generate();
  const signature = await provider.connection.requestAirdrop(
    user.publicKey,
    lamports
  );
  await provider.connection.confirmTransaction(signature, "confirmed");
  return user;
}

export async function createTransferHookMint(
  provider: anchor.AnchorProvider,
  transferHookProgramId: anchor.web3.PublicKey,
  decimals = 2
): Promise<anchor.web3.Keypair> {
  const payer = getPayer(provider);
  const mint = anchor.web3.Keypair.generate();
  const mintSpace = getMintLen([ExtensionType.TransferHook]);
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(
    mintSpace
  );

  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferHookInstruction(
      mint.publicKey,
      payer.publicKey,
      transferHookProgramId,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      payer.publicKey,
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
  const payer = getPayer(provider);
  const account = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    owner,
    false,
    "confirmed",
    undefined,
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
  const payer = getPayer(provider);
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

function getWsUrl(httpUrl: string): string {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export async function sendProviderInstructionsWithKit(
  provider: anchor.AnchorProvider,
  instructions: anchor.web3.TransactionInstruction[]
): Promise<void> {
  const rpc: any = createSolanaRpc(provider.connection.rpcEndpoint as never);
  const rpcSubscriptions: any = createSolanaRpcSubscriptions(
    getWsUrl(provider.connection.rpcEndpoint) as never
  );
  const sendAndConfirm: any = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  } as never);
  const payerSigner: any = await fromLegacyKeypair(getPayer(provider));
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payerSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        instructions.map((instruction) =>
          fromLegacyTransactionInstruction(instruction)
        ),
        tx
      )
  );
  const signedTransaction = await signTransactionMessageWithSigners(message);
  await sendAndConfirm(signedTransaction as never, { commitment: "confirmed" });
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
  await sendProviderInstructionsWithKit(provider, [instruction]);
}

export async function createHookFixture(
  program: JettyProgram,
  initialAmount = 1_000n
): Promise<HookFixture> {
  const provider = program.provider as anchor.AnchorProvider;
  const payer = getPayer(provider);
  const mint = await createTransferHookMint(provider, program.programId);
  const [hookConfigPda, hookConfigBump] = deriveHookConfigPda(
    mint.publicKey,
    program.programId
  );
  const [extraAccountMetaListPda, extraAccountMetaListBump] =
    deriveExtraAccountMetaListPda(mint.publicKey, program.programId);

  await program.methods
    .initializeHookConfig()
    .accounts({
      payer: payer.publicKey,
      policyAuthority: payer.publicKey,
      mint: mint.publicKey,
    })
    .rpc();

  await program.methods
    .initExtraAccountMetaList()
    .accounts({
      payer: payer.publicKey,
      policyAuthority: payer.publicKey,
      mint: mint.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  const sourceTokenAccount = await getOrCreateToken2022Ata(
    provider,
    mint.publicKey,
    payer.publicKey
  );
  const destinationOwner = await createFundedUser(provider);
  const destinationTokenAccount = await getOrCreateToken2022Ata(
    provider,
    mint.publicKey,
    destinationOwner.publicKey
  );

  await mintToken2022To(
    provider,
    mint.publicKey,
    sourceTokenAccount,
    initialAmount,
    2
  );

  return {
    mint,
    decimals: 2,
    hookConfigPda,
    hookConfigBump,
    extraAccountMetaListPda,
    extraAccountMetaListBump,
    sourceOwner: payer.publicKey,
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
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID
  );
}

export function extractErrorCode(error: unknown): number | null {
  const candidate = error as {
    error?: { errorCode?: { number?: number } };
    code?: number;
    logs?: string[];
  };
  if (candidate.error?.errorCode?.number !== undefined) {
    return candidate.error.errorCode.number;
  }
  if (candidate.code !== undefined && candidate.code >= 6000) {
    return candidate.code;
  }
  if (candidate.logs) {
    const parsed = anchor.AnchorError.parse(candidate.logs);
    if (parsed) {
      return parsed.error.errorCode.number;
    }
  }
  return null;
}
