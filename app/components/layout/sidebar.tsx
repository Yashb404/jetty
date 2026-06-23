import React from "react";
import Link from "next/link";
import { LayoutDashboard, Settings2, Activity, BookOpen } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r-2 border-black bg-[#D1D1D0] flex flex-col font-mono min-h-screen">
      <div className="p-6 border-b-2 border-black">
        <h1 className="text-2xl font-bold uppercase tracking-tighter text-black">Jetty</h1>
        <p className="text-xs uppercase tracking-widest text-[#5C4E4E] mt-1 font-semibold">Compliance Controller</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link href="/policy" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <Settings2 className="w-5 h-5" />
          Policy
        </Link>
        <Link href="/activity" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <Activity className="w-5 h-5" />
          Activity
        </Link>
      </nav>

      <div className="p-4 border-t-2 border-black">
        <Link href="/docs" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <BookOpen className="w-5 h-5" />
          Docs
        </Link>
      </div>

      <div className="p-6 border-t-2 border-black text-xs text-[#5C4E4E] font-semibold uppercase tracking-widest text-center">
        V 0.1.0-BETA
      </div>
    </aside>
  );
}
