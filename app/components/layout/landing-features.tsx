import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

export default function LandingFeatures() {
  return (
    <section className="py-12">
      <div className="px-8 max-w-6xl mx-auto">
        <div className="mb-10">
        <h2 className={`text-2xl font-bold tracking-widest uppercase ${spaceMono.className}`}>BUILT FOR BUILDERS</h2>
        <div className="h-1 w-24 bg-black mt-2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border-2 border-black bg-white p-6">
          <h3 className={`text-xl font-bold uppercase mb-2 ${spaceMono.className}`}>Solana Native</h3>
          <p className="text-base text-[#4c4546]">Built for Token-2022 using Anchor/Rust (zero unsafe blocks).</p>
        </div>
        <div className="border-2 border-black bg-white p-6">
          <h3 className={`text-xl font-bold uppercase mb-2 ${spaceMono.className}`}>Real-time Monitoring</h3>
          <p className="text-base text-[#4c4546]">Event indexing powered by Helius Webhooks.</p>
        </div>
        <div className="border-2 border-black bg-white p-6">
          <h3 className={`text-xl font-bold uppercase mb-2 ${spaceMono.className}`}>Edge Infrastructure</h3>
          <p className="text-base text-[#4c4546]">Low-latency data via Turso / LibSQL.</p>
        </div>
        <div className="border-2 border-black bg-white p-6">
          <h3 className={`text-xl font-bold uppercase mb-2 ${spaceMono.className}`}>Open Source</h3>
          <p className="text-base text-[#4c4546]">Verify logic on-chain or audit the GitHub repo.</p>
        </div>
      </div>
      </div>
    </section>
  );
}
