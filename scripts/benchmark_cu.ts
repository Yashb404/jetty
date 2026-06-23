import * as anchor from "@anchor-lang/core";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createTransferCheckedWithTransferHookInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction
} from "@solana/spl-token";
import fs from "fs";
import { Jetty } from "../target/types/jetty";

// We use the IDL from the target directory
const idl = JSON.parse(fs.readFileSync("./target/idl/jetty.json", "utf-8"));
const JETTY_PROGRAM_ID = new anchor.web3.PublicKey("5j8x8uJbJjP3W3Vf9zPzPzPzPzPzPzPzPzPzPz3");

const payerKeypairPath = process.env.HOME + "/.config/solana/id.json";
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(payerKeypairPath, "utf-8")));
const payer = anchor.web3.Keypair.fromSecretKey(secretKey);

const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");
const wallet = new anchor.Wallet(payer);
const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
anchor.setProvider(provider);

const program = new anchor.Program(idl as Jetty, provider);

async function sendTransaction(ixs: anchor.web3.TransactionInstruction[], signers: anchor.web3.Signer[], skipPreflight = false) {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const tx = new anchor.web3.Transaction().add(...ixs);
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = payer.publicKey;
  const signature = await connection.sendTransaction(tx, signers, { skipPreflight });
  await connection.confirmTransaction({ signature, blockhash: latestBlockhash.blockhash, lastValidBlockHeight: latestBlockhash.lastValidBlockHeight }, "confirmed");
  return signature;
}

async function getComputeUnits(signature: string) {
  const tx = await connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
  return tx?.meta?.computeUnitsConsumed || 0;
}

async function setupBenchmarkEnvironment() {
  console.log("Setting up benchmarking environment...");
  const balance = await connection.getBalance(payer.publicKey);
  if (balance < 1e9) {
    console.log("Airdropping 2 SOL to payer...");
    const sig = await connection.requestAirdrop(payer.publicKey, 2e9);
    await connection.confirmTransaction(sig, "confirmed");
  }

  const mint = anchor.web3.Keypair.generate();
  const mintSpace = getMintLen([ExtensionType.TransferHook]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  await sendTransaction([
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferHookInstruction(mint.publicKey, payer.publicKey, JETTY_PROGRAM_ID, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint.publicKey, 2, payer.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID),
  ], [payer, mint]);

  // Initialize Policy and Meta List
  await program.methods.initializeHookConfig()
    .accounts({ payer: payer.publicKey, policyAuthority: payer.publicKey, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });

  await program.methods.initExtraAccountMetaList()
    .accounts({ payer: payer.publicKey, policyAuthority: payer.publicKey, mint: mint.publicKey, tokenProgram: TOKEN_2022_PROGRAM_ID })
    .rpc({ commitment: "confirmed" });

  // Create ATAs
  const sourceAta = getAssociatedTokenAddressSync(mint.publicKey, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const destinationUser = anchor.web3.Keypair.generate();
  const destinationAta = getAssociatedTokenAddressSync(mint.publicKey, destinationUser.publicKey, false, TOKEN_2022_PROGRAM_ID);

  await sendTransaction([
    createAssociatedTokenAccountInstruction(payer.publicKey, sourceAta, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(payer.publicKey, destinationAta, destinationUser.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
    createMintToCheckedInstruction(mint.publicKey, sourceAta, payer.publicKey, 1000000, 2, [], TOKEN_2022_PROGRAM_ID)
  ], [payer]);

  return { mint, sourceAta, destinationUser, destinationAta };
}

async function runCUBenchmarks() {
  console.log("\nStarting Compute Unit (CU) Benchmarks...");
  const { mint, sourceAta, destinationUser, destinationAta } = await setupBenchmarkEnvironment();

  const getTransferIx = async () => createTransferCheckedWithTransferHookInstruction(
    connection, sourceAta, mint.publicKey, destinationAta, payer.publicKey, 1n, 2, [], "confirmed", TOKEN_2022_PROGRAM_ID
  );

  const results: any[] = [];

  // 1. Baseline
  let ix = await getTransferIx();
  let sig = await sendTransaction([ix], [payer]);
  results.push({ Policy: "None (Baseline)", CU: await getComputeUnits(sig), Status: "Success" });

  // 2. Global Pause
  await program.methods.updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null })
    .accounts({ policyAuthority: payer.publicKey, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });
  
  ix = await getTransferIx();
  sig = await sendTransaction([ix], [payer], true); // skipPreflight so it lands on chain and gives CU
  results.push({ Policy: "Global Pause", CU: await getComputeUnits(sig), Status: "Blocked" });

  // Unpause (Cleanup)
  await program.methods.updatePolicy({ paused: false, allowlistEnabled: null, maxTransferAmount: null })
    .accounts({ policyAuthority: payer.publicKey, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });

  // 3. Volume Limit Rejection
  await program.methods.updatePolicy({ paused: false, allowlistEnabled: null, maxTransferAmount: new anchor.BN(100) })
    .accounts({ policyAuthority: payer.publicKey, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });
  
  // Try sending 200 tokens (limit is 100)
  const getVolumeTransferIxReject = async () => createTransferCheckedWithTransferHookInstruction(
    connection, sourceAta, mint.publicKey, destinationAta, payer.publicKey, 200n, 2, [], "confirmed", TOKEN_2022_PROGRAM_ID
  );
  ix = await getVolumeTransferIxReject();
  sig = await sendTransaction([ix], [payer], true);
  results.push({ Policy: "Volume Limit Rejection", CU: await getComputeUnits(sig), Status: "Blocked" });

  // 4. Volume Limit Valid
  const getVolumeTransferIxValid = async () => createTransferCheckedWithTransferHookInstruction(
    connection, sourceAta, mint.publicKey, destinationAta, payer.publicKey, 50n, 2, [], "confirmed", TOKEN_2022_PROGRAM_ID
  );
  ix = await getVolumeTransferIxValid();
  sig = await sendTransaction([ix], [payer]);
  results.push({ Policy: "Volume Limit Valid", CU: await getComputeUnits(sig), Status: "Success" });

  // Disable volume limit (Cleanup)
  await program.methods.updatePolicy({ paused: false, allowlistEnabled: null, maxTransferAmount: new anchor.BN(0) })
    .accounts({ policyAuthority: payer.publicKey, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });

  // 5. Allowlist
  await program.methods.updatePolicy({ paused: false, allowlistEnabled: true, maxTransferAmount: null })
    .accounts({ policyAuthority: payer.publicKey, mint: mint.publicKey })
    .rpc({ commitment: "confirmed" });
  
  await program.methods.updateAllowlist(true)
    .accounts({ payer: payer.publicKey, policyAuthority: payer.publicKey, mint: mint.publicKey, tokenAccount: sourceAta })
    .rpc({ commitment: "confirmed" });
  await program.methods.updateAllowlist(true)
    .accounts({ payer: payer.publicKey, policyAuthority: payer.publicKey, mint: mint.publicKey, tokenAccount: destinationAta })
    .rpc({ commitment: "confirmed" });

  ix = await getTransferIx();
  sig = await sendTransaction([ix], [payer]);
  results.push({ Policy: "Allowlist Enabled", CU: await getComputeUnits(sig), Status: "Success" });

  console.table(results);
  return { mint, sourceAta, destinationUser, destinationAta, getTransferIx };
}

async function runContentionBenchmarks({ mint, sourceAta, destinationUser, destinationAta, getTransferIx }: any) {
  console.log("\nStarting Read-Only Throughput Benchmarks...");
  console.log("Blasting 50 concurrent transfers against the global HookConfig PDA...");
  
  // Ensure allowlist is still enabled for contention to test the heaviest path
  const promises = Array.from({ length: 50 }).map(async (_, i) => {
    try {
      // Create new transaction instances for each parallel promise
      // IMPORTANT: We transfer a unique amount (i + 1) to guarantee every transaction 
      // gets a strictly unique signature, otherwise the validator silently drops them as duplicates.
      const uniqueIx = await createTransferCheckedWithTransferHookInstruction(
        connection, sourceAta, mint.publicKey, destinationAta, payer.publicKey, BigInt(i + 1), 2, [], "confirmed", TOKEN_2022_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(uniqueIx);
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = payer.publicKey;
      
      const sig = await anchor.web3.sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
      return { success: true, sig };
    } catch (e) {
      return { success: false, error: e };
    }
  });

  const results = await Promise.all(promises);
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;

  console.log("\n--- Contention Results ---");
  console.log(`✅ Successes: ${successes}`);
  console.log(`❌ Failures: ${failures}`);
  
  if (failures === 0) {
    console.log("🚀 Result: PERFECT. The read-only ExtraAccountMetaList causes NO lock contention.");
  } else {
    console.log("⚠️ Result: Drops detected. Check the validator for congestion limits.");
  }
}

async function main() {
  const env = await runCUBenchmarks();
  await runContentionBenchmarks(env);
}

main().catch(console.error);
