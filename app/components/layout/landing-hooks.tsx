"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Space_Mono } from "next/font/google";
import { ArrowLeft, ArrowRight, PauseCircle, Gauge, ShieldCheck, Timer, PieChart, Hourglass } from "lucide-react";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

const transferHooks = [
  {
    icon: PauseCircle,
    title: "Global Pause",
    desc: "Instantly freeze all token transfers across the entire supply.",
  },
  {
    icon: Gauge,
    title: "Volume Limits",
    desc: "Enforce anti-whale ceilings and floors on individual transfers.",
  },
  {
    icon: ShieldCheck,
    title: "Allowlist & Denylist",
    desc: "Restrict transfers to pre-approved accounts or block flagged addresses.",
  },
  {
    icon: Timer,
    title: "Vesting Locks",
    desc: "Prevent transfers from accounts until a configured Unix timestamp.",
  },
  {
    icon: PieChart,
    title: "Receiver Cap",
    desc: "Limit the maximum percentage of supply a single wallet can accumulate.",
  },
  {
    icon: Hourglass,
    title: "Cooldowns",
    desc: "Enforce mandatory waiting periods between outgoing transfers.",
  },
];

export default function LandingHooks() {
  const [startIndex, setStartIndex] = useState(0);
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    if (!isAuto) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % transferHooks.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuto]);

  const handleNext = () => {
    setIsAuto(false);
    setStartIndex((prev) => (prev + 1) % transferHooks.length);
  };

  const handlePrev = () => {
    setIsAuto(false);
    setStartIndex((prev) => (prev - 1 + transferHooks.length) % transferHooks.length);
  };

  const visibleHooks = [
    transferHooks[startIndex],
    transferHooks[(startIndex + 1) % transferHooks.length],
    transferHooks[(startIndex + 2) % transferHooks.length],
  ];

  return (
    <section className="py-12 bg-[#f4f3f2] border-y-2 border-black">
      <div className="px-8 max-w-6xl mx-auto">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h2 className={`text-2xl font-bold tracking-widest uppercase ${spaceMono.className}`}>SUPPORTED TRANSFER HOOKS</h2>
            <div className="h-1 w-24 bg-black mt-2"></div>
          </div>
          <div className="flex gap-2 hidden md:flex">
            <button onClick={handlePrev} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors" aria-label="Previous">
              <ArrowLeft size={20} />
            </button>
            <button onClick={handleNext} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors" aria-label="Next">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleHooks.map((hook, i) => {
          const IconComponent = hook.icon;
          return (
            <div key={`${hook.title}-${startIndex}`} className="border-2 border-black bg-white p-6 brutalist-shadow group carousel-item" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="mb-4">
                <IconComponent size={40} className="text-black" strokeWidth={1.5} />
              </div>
              <h3 className={`text-xl font-bold uppercase mb-2 ${spaceMono.className}`}>{hook.title}</h3>
              <p className={`text-base text-[#4c4546] ${spaceMono.className}`}>
                {hook.desc}
              </p>
              <Link href="/docs" className="mt-6 inline-block text-xs font-bold tracking-[0.1em] uppercase text-black underline group-hover:no-underline cursor-pointer">
                View Implementation →
              </Link>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
