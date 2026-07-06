import React from "react";
import Link from "next/link";
import { Book, Shield, Ban, Activity, ShieldAlert, Users, Lock, Clock } from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-1 min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Docs Minimal Sidebar (Right Side) */}
        <aside className="w-56 flex flex-col font-mono shrink-0 overflow-y-auto p-8 border-l-2 border-transparent">
          <nav className="flex-1 space-y-4">
            <Link href="/docs" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Book className="w-4 h-4" />
              Overview
            </Link>
            <Link href="/docs/quick-guide" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Activity className="w-4 h-4" />
              Quick Start
            </Link>

            <div className="pt-6 pb-2 text-xs font-bold text-black uppercase tracking-widest border-b-2 border-transparent">
              Modules
            </div>

            <Link href="/docs/global-pause" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <ShieldAlert className="w-4 h-4" />
              Global Pause
            </Link>
            <Link href="/docs/volume-limits" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Activity className="w-4 h-4" />
              Volume Limits
            </Link>
            <Link href="/docs/min-transfer" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Shield className="w-4 h-4" />
              Anti-Dust
            </Link>
            <Link href="/docs/receiver-cap" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Users className="w-4 h-4" />
              Receiver Cap
            </Link>
            <Link href="/docs/allowlist" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Shield className="w-4 h-4" />
              Allowlist
            </Link>
            <Link href="/docs/denylist" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Ban className="w-4 h-4" />
              Denylist
            </Link>
            <Link href="/docs/vesting" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Lock className="w-4 h-4" />
              Vesting
            </Link>
            <Link href="/docs/cooldown" className="flex items-center gap-3 text-sm text-[#5C4E4E] font-bold uppercase tracking-wide hover:text-black transition-colors">
              <Clock className="w-4 h-4" />
              Cooldown
            </Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
