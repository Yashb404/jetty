"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getJettyProgram } from "../lib/anchor/program";

const AnchorContext = createContext<any>(null);

export function useAnchorWorkspace() {
  return useContext(AnchorContext);
}

export default function AnchorWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { provider, program } = useMemo(() => {
    if (!wallet) return { provider: null, program: null };

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });

    const program = getJettyProgram(connection, provider);

    return { provider, program };
  }, [connection, wallet]);

  return (
    <AnchorContext.Provider value={{ program, provider }}>
      {children}
    </AnchorContext.Provider>
  );
}
