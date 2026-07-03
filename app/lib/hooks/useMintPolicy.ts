"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWorkspace } from "../../contexts/AnchorProvider";
import { deriveHookConfigPda, deriveExtraAccountMetaListPda } from "../anchor/pdas";
import { HookConfig } from "../anchor/types";
import toast from "react-hot-toast";

export function useMintPolicy(mintAddressString: string | null) {
  const { program } = useAnchorWorkspace();
  const [policy, setPolicy] = useState<HookConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [metaListExists, setMetaListExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program || !mintAddressString) {
      setPolicy(null);
      setIsInitialized(false);
      setMetaListExists(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mint = new PublicKey(mintAddressString);
      const [hookConfigPda] = deriveHookConfigPda(mint);
      const [metaListPda] = deriveExtraAccountMetaListPda(mint);

      try {
        const fetchedPolicy = await program.account.hookConfig.fetch(hookConfigPda);
        setPolicy(fetchedPolicy as unknown as HookConfig);
        setIsInitialized(true);
      } catch {
        // Account does not exist
        setPolicy(null);
        setIsInitialized(false);
      }

      const metaListAccountInfo = await program.provider.connection.getAccountInfo(metaListPda);
      setMetaListExists(metaListAccountInfo !== null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Failed to fetch")) {
        toast.error("Network connection refused. Please check if your Solana cluster is running.");
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [program, mintAddressString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return {
    policy,
    isInitialized,
    metaListExists,
    loading,
    error,
    refetch,
  };
}
