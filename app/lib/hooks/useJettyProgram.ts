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
import { BN } from "@coral-xyz/anchor";
import { useAnchorWorkspace } from "../../contexts/AnchorProvider";
import {
  deriveHookConfigPda,
  deriveExtraAccountMetaListPda,
  deriveAllowlistEntryPda,
} from "../anchor/pdas";

export function useJettyProgram() {
  const { program } = useAnchorWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: () => Promise<string>, actionName: string) => {
    if (!program) throw new Error("Anchor program is not initialized");
    setLoading(true);
    setError(null);
    try {
      const tx = await action();
      console.log(`[${actionName}] Success: ${tx}`);
      return tx;
    } catch (err: any) {
      console.error(`[${actionName}] Error:`, err);
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initializeHookConfig = async (mint: PublicKey) => {
    return executeAction(async () => {
      const [hookConfig] = deriveHookConfigPda(mint);
      return program.methods
        .initializeHookConfig()
        .accounts({
          payer: program.provider.publicKey,
          policyAuthority: program.provider.publicKey,
          mint,
          hookConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }, "initializeHookConfig");
  };

  const initExtraAccountMetaList = async (mint: PublicKey) => {
    return executeAction(async () => {
      const [hookConfig] = deriveHookConfigPda(mint);
      const [extraAccountMetaList] = deriveExtraAccountMetaListPda(mint);
      return program.methods
        .initExtraAccountMetaList()
        .accounts({
          payer: program.provider.publicKey,
          policyAuthority: program.provider.publicKey,
          mint,
          hookConfig,
          extraAccountMetaList,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
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
    return executeAction(async () => {
      const [hookConfig] = deriveHookConfigPda(mint);
      return program.methods
        .updatePolicy({ paused, allowlistEnabled, maxTransferAmount })
        .accounts({
          policyAuthority: program.provider.publicKey,
          mint,
          hookConfig,
        })
        .rpc();
    }, "updatePolicy");
  };

  const updateAllowlist = async (mint: PublicKey, tokenAccount: PublicKey, active: boolean) => {
    return executeAction(async () => {
      const [hookConfig] = deriveHookConfigPda(mint);
      const [allowlistEntry] = deriveAllowlistEntryPda(mint, tokenAccount);
      return program.methods
        .updateAllowlist(active)
        .accounts({
          payer: program.provider.publicKey,
          policyAuthority: program.provider.publicKey,
          mint,
          hookConfig,
          tokenAccount,
          allowlistEntry,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }, "updateAllowlist");
  };

  const assignPolicyAuthority = async (mint: PublicKey, newAuthority: PublicKey) => {
    return executeAction(async () => {
      const [hookConfig] = deriveHookConfigPda(mint);
      // NOTE: This instruction requires both current and new authority to sign.
      // Assuming this is handled via a multi-sig or extra signers if necessary.
      // For now, if the new authority is not a signer here, it will fail unless passed in `.signers()`.
      // The frontend might need adjustment to handle multiple signers.
      return program.methods
        .assignPolicyAuthority()
        .accounts({
          currentAuthority: program.provider.publicKey,
          newAuthority,
          mint,
          hookConfig,
        })
        .rpc();
    }, "assignPolicyAuthority");
  };

  const createToken2022Mint = async () => {
    return executeAction(async () => {
      const mint = Keypair.generate();
      const mintSpace = getMintLen([ExtensionType.TransferHook]);
      const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(mintSpace);
      
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: program.provider.publicKey,
          newAccountPubkey: mint.publicKey,
          space: mintSpace,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferHookInstruction(
          mint.publicKey,
          program.provider.publicKey,
          program.programId,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mint.publicKey,
          2,
          program.provider.publicKey,
          program.provider.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      const latestBlockhash = await program.provider.connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = program.provider.publicKey;
      
      transaction.sign(mint);
      
      await program.provider.sendAndConfirm(transaction, [mint]);
      
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
