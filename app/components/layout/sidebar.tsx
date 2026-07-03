import React from "react";
import Link from "next/link";
import Image from "next/image";
import logoBlack from "../../assets/bw.svg";
import { LayoutDashboard, Library, Activity, BookOpen, LifeBuoy } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r-2 border-black bg-[#D1D1D0] flex flex-col font-mono h-full shrink-0">
      <div className="p-6 border-b-2 border-black">
        <div className="flex items-center gap-3 mb-2">
          <Image src={logoBlack} alt="Jetty Logo" className="w-14 h-auto" />
          <h1 className="text-3xl font-bold uppercase tracking-tighter text-black">Jetty</h1>
        </div>
        <p className="text-xs uppercase tracking-widest text-[#5C4E4E] font-semibold">Compliance Controller</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link href="/library" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <Library className="w-5 h-5" />
          Library
        </Link>
        <Link href="/allowlist" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <Activity className="w-5 h-5" />
          Allowlist
        </Link>
        <Link href="/history" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </Link>
      </nav>

      <div className="p-4 border-t-2 border-black flex flex-col gap-2">
        <Link href="/support" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <LifeBuoy className="w-5 h-5" />
          Support
        </Link>
        <Link href="/docs" className="flex items-center gap-3 px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
          <BookOpen className="w-5 h-5" />
          Docs
        </Link>
      </div>

      <div className="p-6 border-t-2 border-black text-xs text-[#5C4E4E] font-semibold uppercase tracking-widest text-center">
        V 0.1.1-BETA
      </div>
    </aside>
  );
}
