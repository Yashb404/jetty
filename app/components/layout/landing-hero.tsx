import Image from "next/image";
import { Space_Mono } from "next/font/google";
import LandingButton from "../ui/landing-button";
import logo from "../../assets/bw.svg";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

export default function LandingHero() {
  return (
    <section className="py-12 md:py-20 overflow-hidden">
      <div className="px-8 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
        <div className="inline-block border-2 border-black bg-[#FEFCE8] px-3 py-1 mb-4">
          <span className={`text-sm uppercase text-[#D97706] font-bold ${spaceMono.className}`}>Deployed on Devnet</span>
        </div>
        <h1 className={`text-3xl md:text-5xl leading-tight uppercase font-bold tracking-widest ${spaceMono.className}`}>
          The Zero-Code Compliance Layer for Solana Token-2022
        </h1>
        <p className="text-lg text-[#4c4546] max-w-xl">
          Enforce modular, on-chain compliance policies without writing a single line of custom Rust code.
        </p>
        <div className="pt-4 flex flex-wrap gap-4">
          <LandingButton href="/dashboard" variant="primary" className="px-8 py-4 text-sm">
            Launch Dashboard
          </LandingButton>
          <LandingButton href="/docs" variant="secondary" className="px-8 py-4 text-sm">
            Read the Docs
          </LandingButton>
        </div>
      </div>
      <div className="relative">
        <div className="border-2 border-black bg-white brutalist-shadow p-8 flex items-center justify-center min-h-[300px]">
          <Image src={logo} alt="Jetty Logo" className="w-full max-w-[400px] h-auto grayscale hover:grayscale-0 transition-all duration-500" priority />
        </div>
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-black border-2 border-black hidden md:block"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-8 bg-[#e3e2e1] border-2 border-black hidden md:block"></div>
      </div>
      </div>
    </section>
  );
}
