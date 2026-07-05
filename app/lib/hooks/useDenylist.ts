"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWorkspace } from "../../contexts/AnchorProvider";
import { DenylistEntry } from "../anchor/types";

export interface DenylistAccountData {
  publicKey: PublicKey;
  account: DenylistEntry;
}

export function useDenylist(mintAddressString: string | null) {
  const { program } = useAnchorWorkspace();
  const [entries, setEntries] = useState<DenylistAccountData[]>([]);
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
      const accounts = await program.account.denylistEntry.all([
        {
          memcmp: {
            offset: 8,
            bytes: mint.toBase58(),
          },
        },
      ]);

      setEntries(accounts as unknown as DenylistAccountData[]);
    } catch (err: unknown) {
      console.error("useDenylist error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [program, mintAddressString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return {
    entries,
    loading,
    error,
    refetch,
  };
}
