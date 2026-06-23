"use client";

import { useState } from "react";
import { PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";
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
import {
  deriveHookConfigPda,
  deriveExtraAccountMetaListPda,
  deriveAllowlistEntryPda,
} from "../anchor/pdas";

export function useJettyProgram() {
  const { program } = useAnchorWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: (prog: Program<Jetty>) => Promise<string>, actionName: string) => {
    if (!program) throw new Error("Anchor program is not initialized");
    setLoading(true);
    setError(null);
    try {
      const tx = await action(program);
      console.log(`[${actionName}] Success: ${tx}`);
      return tx;
    } catch (err: unknown) {
      console.error(`[${actionName}] Error:`, err);
      setError(err instanceof Error ? err.message : String(err));
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
    }, "initializeHookConfig");
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
    }, "initExtraAccountMetaList");
  };

  const updatePolicy = async (
    mint: PublicKey,
    paused: boolean | null,
    allowlistEnabled: boolean | null,
    maxTransferAmount: BN | null
  ) => {
    return executeAction(async (prog) => {
      return prog.methods
        .updatePolicy({ paused, allowlistEnabled, maxTransferAmount })
        .accounts({
          policyAuthority: prog.provider.publicKey!,
          mint,
        })
        .rpc();
    }, "updatePolicy");
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
    }, "updateAllowlist");
  };

  const assignPolicyAuthority = async (mint: PublicKey, newAuthority: PublicKey) => {
    return executeAction(async (prog) => {
      // NOTE: This instruction requires both current and new authority to sign.
      // Assuming this is handled via a multi-sig or extra signers if necessary.
      // For now, if the new authority is not a signer here, it will fail unless passed in `.signers()`.
      // The frontend might need adjustment to handle multiple signers.
      return prog.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: prog.provider.publicKey!,
          newAuthority,
          mint,
        })
        .rpc();
    }, "assignPolicyAuthority");
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
      
      const latestBlockhash = await prog.provider.connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = prog.provider.publicKey!;
      
      transaction.sign(mint);
      
      await prog.provider.sendAndConfirm!(transaction, [mint]);
      
      return mint.publicKey.toBase58();
    }, "createToken2022Mint");
  };

  return {
    loading,
    error,
    initializeHookConfig,
    initExtraAccountMetaList,
    updatePolicy,
    updateAllowlist,
    assignPolicyAuthority,
    createToken2022Mint,
  };
}
