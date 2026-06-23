"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Jetty } from "../lib/anchor/jetty";
import { getJettyProgram } from "../lib/anchor/program";

interface AnchorWorkspace {
  provider: AnchorProvider | null;
  program: Program<Jetty> | null;
}

const AnchorContext = createContext<AnchorWorkspace>({ provider: null, program: null });

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
