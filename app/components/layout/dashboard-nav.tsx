"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import WalletConnect from "../web3/wallet-connect";
import logoBlack from "../../assets/bw.svg";

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-between items-center w-full px-8 h-16 sticky top-0 z-50 bg-[#f4f3f2] border-b-2 border-black shrink-0">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
        <Image src={logoBlack} alt="Jetty Logo" className="w-8 h-auto" />
        <span className="text-xl font-bold tracking-tighter text-black uppercase font-space">JETTY</span>
      </Link>
      <div className="flex items-center gap-4">
        {/* Hide wallet connect on docs pages to prevent contention */}
        {!pathname?.startsWith("/docs") && <WalletConnect />}
      </div>
    </nav>
  );
}
