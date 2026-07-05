"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  const proxyUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_PROXY_URL || "/api/rpc";
  // FIXME: "Hardcoding localhost:3000 for SSR will break during production static builds if deployed elsewhere. Replace with an environment variable like NEXT_PUBLIC_APP_URL once the production domain is known."
  const endpoint = typeof window !== "undefined" 
    ? `${window.location.origin}${proxyUrl}` 
    : `http://localhost:3000${proxyUrl}`;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
