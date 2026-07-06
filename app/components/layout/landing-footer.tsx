import Link from "next/link";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

export default function LandingFooter() {
  return (
    <footer className="w-full px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-black text-white border-t-2 border-white/20">
      <div className="flex flex-col items-center md:items-start">
        <span className={`text-2xl font-bold text-white mb-2 ${spaceMono.className}`}>JETTY</span>
        <p className={`text-sm opacity-70 ${spaceMono.className}`}>© 2026 JETTY PROTOCOL. COMPLIANCE AS CODE.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        <a href="https://github.com/Yashb404/jetty" target="_blank" className={`text-sm text-white/70 hover:text-white transition-opacity underline ${spaceMono.className}`}>View on GitHub</a>
        <Link href="/docs" className={`text-sm text-white/70 hover:text-white transition-opacity underline ${spaceMono.className}`}>Documentation</Link>
      </div>
    </footer>
  );
}
