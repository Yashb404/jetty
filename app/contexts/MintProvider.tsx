"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";

interface MintContextState {
  activeMint: string | null;
  setActiveMint: (mint: string | null) => void;
}

const MintContext = createContext<MintContextState>({
  activeMint: null,
  setActiveMint: () => {},
});

export function useMintContext() {
  return useContext(MintContext);
}

const STORAGE_KEY = "jetty:active_mint";

export default function MintProvider({ children }: { children: React.ReactNode }) {
  const [activeMint, setActiveMintState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate safely on the client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Strict Validation: Must be a valid Solana PublicKey
        new PublicKey(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveMintState(stored);
      }
    } catch {
      // Discard invalid payloads to prevent injection/prototype pollution
      console.warn("Invalid mint address in localStorage. Discarding.");
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setActiveMint = useCallback((mint: string | null) => {
    if (mint) {
      try {
        // Strict Validation: Must be a valid Solana PublicKey
        new PublicKey(mint);
        setActiveMintState(mint);
        localStorage.setItem(STORAGE_KEY, mint);
      } catch {
        console.error("Attempted to save an invalid mint address.");
      }
    } else {
      setActiveMintState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (!hydrated) {
    // Prevent SSR hydration mismatches by rendering nothing (or a loader)
    // until we've parsed the localStorage value safely.
    return null;
  }

  return (
    <MintContext.Provider value={{ activeMint, setActiveMint }}>
      {children}
    </MintContext.Provider>
  );
}
