import * as anchor from "@anchor-lang/core";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  getMintLen,
} from "@solana/spl-token";
import fs from "fs";

// Load local keypair for payer (Anchor default: ~/.config/solana/id.json)
const payerKeypairPath = process.env.HOME + "/.config/solana/id.json";
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(payerKeypairPath, "utf-8")));
const payer = anchor.web3.Keypair.fromSecretKey(secretKey);

// Connect to Localnet
const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");

// The Jetty Compliance Engine Program ID
const JETTY_PROGRAM_ID = new anchor.web3.PublicKey("4DcxDMd7iFppUn6aGkuJY3xNaF9FFNduchqByYmXiKku");

async function main() {
  console.log(`Connecting to Localnet using wallet: ${payer.publicKey.toBase58()}`);
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL`);

  if (balance === 0) {
    console.error("Wallet has 0 SOL. Run `solana airdrop 2` first.");
    process.exit(1);
  }

  const mint = anchor.web3.Keypair.generate();
  console.log(`Generating new Token-2022 Mint: ${mint.publicKey.toBase58()}`);

  const mintSpace = getMintLen([ExtensionType.TransferHook]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

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
      payer.publicKey, // transfer hook authority
      JETTY_PROGRAM_ID, // transfer hook program ID
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      2, // decimals
      payer.publicKey, // mint authority
      payer.publicKey, // freeze authority
      TOKEN_2022_PROGRAM_ID
    )
  );

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.feePayer = payer.publicKey;

  console.log("Sending transaction to create Mint with Transfer Hook extension...");
  
  const signature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mint],
    { commitment: "confirmed" }
  );

  console.log(`Success! Transaction Signature: ${signature}`);
  console.log(`\n==============================================`);
  console.log(`NEW MINT ADDRESS: ${mint.publicKey.toBase58()}`);
  console.log(`==============================================\n`);
  console.log(`Paste this address into your Dashboard's 'Target Mint' field.`);
}

main().catch(console.error);
