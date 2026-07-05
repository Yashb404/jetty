"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWorkspace } from "../../contexts/AnchorProvider";
import { VestingEntry } from "../anchor/types";

export interface VestingAccountData {
  publicKey: PublicKey;
  account: VestingEntry;
}

export function useVesting(mintAddressString: string | null) {
  const { program } = useAnchorWorkspace();
  const [entries, setEntries] = useState<VestingAccountData[]>([]);
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
      const accounts = await program.account.vestingEntry.all([
        {
          memcmp: {
            offset: 8,
            bytes: mint.toBase58(),
          },
        },
      ]);

      setEntries(accounts as unknown as VestingAccountData[]);
    } catch (err: unknown) {
      console.error("useVesting error:", err);
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
