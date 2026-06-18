"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWorkspace } from "../../contexts/AnchorProvider";
import { AllowlistEntry } from "../anchor/types";

export interface AllowlistAccountData {
  publicKey: PublicKey;
  account: AllowlistEntry;
}

export function useAllowlist(mintAddressString: string | null) {
  const { program } = useAnchorWorkspace();
  const [entries, setEntries] = useState<AllowlistAccountData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program || !mintAddressString) {
      setEntries([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mint = new PublicKey(mintAddressString);
      // Filter by mint (offset 8 since Anchor discriminator is 8 bytes)
      const accounts = await program.account.allowlistEntry.all([
        {
          memcmp: {
            offset: 8,
            bytes: mint.toBase58(),
          },
        },
      ]);

      // Sort or transform if needed
      setEntries(accounts as unknown as AllowlistAccountData[]);
    } catch (err: any) {
      console.error("useAllowlist error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [program, mintAddressString]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    entries,
    loading,
    error,
    refetch,
  };
}
