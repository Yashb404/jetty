import Link from "next/link";
import Image from "next/image";
import { Space_Mono } from "next/font/google";
import LandingButton from "../ui/landing-button";
import logoBlack from "../../assets/bw.svg";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

export default function LandingNav() {
  return (
    <nav className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 bg-[#f4f3f2] border-b-2 border-black">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
        <Image src={logoBlack} alt="Jetty Logo" className="w-8 h-auto" />
        <span className={`text-2xl font-bold tracking-tighter text-black uppercase ${spaceMono.className}`}>JETTY</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/docs" className={`hidden md:block text-[#6a5b5b] text-xs font-bold tracking-[0.1em] uppercase hover:bg-black hover:text-white transition-colors duration-150 px-2 py-1 ${spaceMono.className}`}>Docs</Link>
        <LandingButton href="/dashboard" variant="accent" className="px-6 py-2 text-xs">
          Launch App
        </LandingButton>
      </div>
    </nav>
  );
}
