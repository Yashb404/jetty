"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function WalletConnect() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="font-mono font-bold uppercase tracking-wide border-2 border-black bg-[#D1D1D0] text-black rounded-none px-6 py-2.5">Connecting...</button>;
  }

  return (
    <div className="jetty-wallet-btn">
      <WalletMultiButtonDynamic className="!font-mono !font-bold !uppercase !tracking-wide !border-2 !border-black !bg-[#D1D1D0] !text-black hover:!bg-black hover:!text-white !rounded-none !transition-colors !px-6 !py-2.5 !h-auto !line-height-inherit" />
    </div>
  );
}
