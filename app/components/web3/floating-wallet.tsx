"use client";

import React from "react";
import WalletConnect from "./wallet-connect";
import { usePathname } from "next/navigation";

export default function FloatingWallet() {
  const pathname = usePathname();

  // Hide the wallet button on all documentation pages
  if (pathname?.startsWith("/docs")) {
    return null;
  }

  return (
    <div className="absolute top-6 right-8 z-50">
      <WalletConnect />
    </div>
  );
}
