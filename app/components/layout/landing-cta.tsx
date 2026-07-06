import { Space_Mono } from "next/font/google";
import LandingButton from "../ui/landing-button";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

export default function LandingCta() {
  return (
    <section className="py-16 bg-black text-white">
      <div className="px-8 max-w-6xl mx-auto flex flex-col items-center text-center space-y-6">
        <h2 className={`text-3xl md:text-4xl font-bold tracking-widest uppercase max-w-2xl ${spaceMono.className}`}>
          READY TO SECURE YOUR TOKEN?
        </h2>
        <p className={`text-lg text-white/70 max-w-xl ${spaceMono.className}`}>
          Join the next generation of regulated assets on Solana. Start building with industrial-grade compliance today.
        </p>
        <LandingButton 
          href="/dashboard" 
          variant="white"
          className="px-12 py-4"
        >
          Launch Dashboard
        </LandingButton>
      </div>
    </section>
  );
}
