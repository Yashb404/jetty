"use client";

import { useState } from "react";
import { PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";
import { 
  TOKEN_2022_PROGRAM_ID, 
  ExtensionType, 
  getMintLen, 
  createInitializeTransferHookInstruction,
  createInitializeMintInstruction
} from "@solana/spl-token";
import { Program, BN } from "@coral-xyz/anchor";
import { useAnchorWorkspace } from "../../contexts/AnchorProvider";
import { Jetty } from "../anchor/jetty";

export function useJettyProgram() {
  const { program } = useAnchorWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (
    action: (prog: Program<Jetty>) => Promise<string>, 
    actionName: string
  ) => {
    if (!program) throw new Error("Anchor program is not initialized");
    setLoading(true);
    setError(null);
    try {
      const tx = await action(program);
      console.log(`[${actionName}] Success: ${tx}`);
      return tx;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Failed to fetch")) {
        toast.error("Network connection refused. Is your Solana cluster running?");
      } else {
        toast.error(`[${actionName}] Failed: ${msg}`);
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initializeHookConfig = async (mint: PublicKey) => {
    return executeAction(async (prog) => {
      return prog.methods
        .initializeHookConfig()
        .accounts({
          payer: prog.provider.publicKey!,
          policyAuthority: prog.provider.publicKey!,
          mint,
        })
        .rpc();
    }, "Initialize Config");
  };

  const initExtraAccountMetaList = async (mint: PublicKey) => {
    return executeAction(async (prog) => {
      return prog.methods
        .initExtraAccountMetaList()
        .accounts({
          payer: prog.provider.publicKey!,
          policyAuthority: prog.provider.publicKey!,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
    }, "Register Extra Accounts");
  };

  const updatePolicy = async (
    mint: PublicKey,
    paused: boolean | null,
    allowlistEnabled: boolean | null,
    maxTransferAmount: BN | null,
    vestingEnabled: boolean | null,
    minTransferAmount: BN | null,
    maxHolderBps: number | null,
    denylistEnabled: boolean | null,
    cooldownSeconds: number | null
  ) => {
    return executeAction(async (prog) => {
      return prog.methods
        .updatePolicy({ 
          paused, 
          allowlistEnabled, 
          maxTransferAmount,
          vestingEnabled,
          minTransferAmount,
          maxHolderBps,
          denylistEnabled,
          cooldownSeconds
        })
        .accounts({
          policyAuthority: prog.provider.publicKey!,
          mint,
        })
        .rpc();
    }, "Update Policy");
  };

  const updateAllowlist = async (mint: PublicKey, tokenAccount: PublicKey, active: boolean) => {
    return executeAction(async (prog) => {
      return prog.methods
        .updateAllowlist(active)
        .accounts({
          payer: prog.provider.publicKey!,
          policyAuthority: prog.provider.publicKey!,
          mint,
          tokenAccount,
        })
        .rpc();
    }, "Update Allowlist");
  };

  const updateDenylist = async (mint: PublicKey, tokenAccount: PublicKey, blocked: boolean) => {
    return executeAction(async (prog) => {
      return prog.methods
        .updateDenylist(blocked)
        .accounts({
          payer: prog.provider.publicKey!,
          mint,
          tokenAccount,
        })
        .rpc();
    }, "Update Denylist");
  };

  const setVestingLock = async (mint: PublicKey, tokenAccount: PublicKey, releaseTimestamp: BN) => {
    return executeAction(async (prog) => {
      return prog.methods
        .setVestingLock(releaseTimestamp)
        .accounts({
          payer: prog.provider.publicKey!,
          mint,
          tokenAccount,
        })
        .rpc();
    }, "Set Vesting Lock");
  };

  const clearVestingLock = async (mint: PublicKey, tokenAccount: PublicKey) => {
    return executeAction(async (prog) => {
      return prog.methods
        .clearVestingLock()
        .accounts({
          payer: prog.provider.publicKey!,
          mint,
          tokenAccount,
        })
        .rpc();
    }, "Clear Vesting Lock");
  };

  const assignPolicyAuthority = async (mint: PublicKey, newAuthority: PublicKey) => {
    return executeAction(async (prog) => {
      // FIXME: "assignPolicyAuthority requires both the current and new authority to sign. The frontend currently does not prompt the new authority for a signature. We must implement a multi-sig or partial sign workflow before this instruction can be used."
      return prog.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: prog.provider.publicKey!,
          newAuthority,
          mint,
        })
        .rpc();
    }, "Assign Policy Authority");
  };

  const createToken2022Mint = async () => {
    return executeAction(async (prog) => {
      const mint = Keypair.generate();
      const mintSpace = getMintLen([ExtensionType.TransferHook]);
      const lamports = await prog.provider.connection.getMinimumBalanceForRentExemption(mintSpace);
      
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: prog.provider.publicKey!,
          newAccountPubkey: mint.publicKey,
          space: mintSpace,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferHookInstruction(
          mint.publicKey,
          prog.provider.publicKey!,
          prog.programId,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mint.publicKey,
          2,
          prog.provider.publicKey!,
          prog.provider.publicKey!,
          TOKEN_2022_PROGRAM_ID
        )
      );

      const initHookIx = await prog.methods
        .initializeHookConfig()
        .accounts({
          payer: prog.provider.publicKey!,
          policyAuthority: prog.provider.publicKey!,
          mint: mint.publicKey,
        })
        .instruction();

      const initMetaIx = await prog.methods
        .initExtraAccountMetaList()
        .accounts({
          payer: prog.provider.publicKey!,
          policyAuthority: prog.provider.publicKey!,
          mint: mint.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

      transaction.add(initHookIx, initMetaIx);
      
      const latestBlockhash = await prog.provider.connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = prog.provider.publicKey!;
      
      transaction.sign(mint);
      
      await prog.provider.sendAndConfirm!(transaction, [mint]);
      
      return mint.publicKey.toBase58();
    }, "Create and Initialize Mint");
  };

  return {
    loading,
    error,
    initializeHookConfig,
    initExtraAccountMetaList,
    updatePolicy,
    updateAllowlist,
    updateDenylist,
    setVestingLock,
    clearVestingLock,
    assignPolicyAuthority,
    createToken2022Mint,
  };
}
