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
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="font-mono font-bold uppercase tracking-wide border-2 border-black bg-[#FF5722] text-white rounded-none px-6 py-2.5">Connecting...</button>;
  }

  return (
    <div className="jetty-wallet-btn">
      <WalletMultiButtonDynamic className="!font-mono !font-bold !uppercase !tracking-wide !border-2 !border-black !bg-[#FF5722] !text-white hover:!bg-black hover:!text-white !rounded-none !transition-colors !px-6 !py-2.5 !h-auto !line-height-inherit" />
    </div>
  );
}
