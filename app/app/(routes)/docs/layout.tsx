import React from "react";
import Link from "next/link";
import WalletConnect from "../../../components/web3/wallet-connect";
import { Book, Shield, Ban, Activity, ShieldAlert, Users, Lock, Clock } from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full">
      {/* Docs Sidebar */}
      <aside className="w-64 border-r-2 border-black bg-[#D1D1D0] flex flex-col font-mono shrink-0 overflow-y-auto">
        <div className="p-6 border-b-2 border-black sticky top-0 bg-[#D1D1D0] z-10">
          <h2 className="text-xl font-bold uppercase tracking-tighter text-black">Docs</h2>
          <p className="text-xs uppercase tracking-widest text-[#5C4E4E] font-semibold mt-1">Module Guides</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/docs" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Book className="w-4 h-4" />
            Overview
          </Link>
          <Link href="/docs/quick-guide" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Activity className="w-4 h-4" />
            Quick Start
          </Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-[#5C4E4E] uppercase tracking-widest">
            Modules
          </div>
          
          <Link href="/docs/global-pause" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <ShieldAlert className="w-4 h-4" />
            Global Pause
          </Link>
          <Link href="/docs/volume-limits" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Activity className="w-4 h-4" />
            Volume Limits
          </Link>
          <Link href="/docs/min-transfer" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Shield className="w-4 h-4" />
            Anti-Dust
          </Link>
          <Link href="/docs/receiver-cap" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Users className="w-4 h-4" />
            Receiver Cap
          </Link>
          <Link href="/docs/allowlist" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Shield className="w-4 h-4" />
            Allowlist
          </Link>
          <Link href="/docs/denylist" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Ban className="w-4 h-4" />
            Denylist
          </Link>
          <Link href="/docs/vesting" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Lock className="w-4 h-4" />
            Vesting
          </Link>
          <Link href="/docs/cooldown" className="flex items-center gap-3 px-4 py-2 text-sm text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
            <Clock className="w-4 h-4" />
            Cooldown
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <header className="flex justify-between items-center shrink-0 h-16 px-8 w-full border-b-2 border-black bg-[#D1D1D0] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold font-mono uppercase tracking-widest text-black">Network: Devnet</span>
          </div>
          <div className="flex items-center gap-4">
            <WalletConnect />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
