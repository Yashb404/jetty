"use client";

import { useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
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

  return {
    loading,
    error,
    initializeHookConfig,
    initExtraAccountMetaList,
    updatePolicy,
    updateAllowlist,
    assignPolicyAuthority,
  };
}
