"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Space_Mono } from "next/font/google";
import { ArrowLeft, ArrowRight, PauseCircle, Gauge, ShieldCheck, Timer, PieChart, Hourglass, Ban, Coins } from "lucide-react";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

const transferHooks = [
  {
    icon: PauseCircle,
    title: "Global Pause",
    desc: "Instantly freeze all token transfers across the entire network.",
  },
  {
    icon: ShieldCheck,
    title: "Allowlist",
    desc: "Restrict transfers strictly to pre-approved wallets.",
  },
  {
    icon: Ban,
    title: "Denylist",
    desc: "Block explicitly flagged wallets from transferring tokens.",
  },
  {
    icon: Gauge,
    title: "Volume Limits",
    desc: "Set a maximum ceiling for any single transaction.",
  },
  {
    icon: Coins,
    title: "Anti-Dust",
    desc: "Set a minimum transfer size to prevent dust attacks.",
  },
  {
    icon: PieChart,
    title: "Receiver Cap",
    desc: "Limit maximum holder balances based on total supply percentage.",
  },
  {
    icon: Hourglass,
    title: "Velocity Limiter",
    desc: "Enforce cooldown periods between successive transfers.",
  },
  {
    icon: Timer,
    title: "Vesting / Lockup",
    desc: "Lock tokens until a predefined timestamp for scheduled releases.",
  },
];

export default function LandingHooks() {
  const [isAuto, setIsAuto] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuto) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        // If we reached the end, smoothly go back to the start
        if (scrollLeft >= maxScroll - 10) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll by the container width (moves 3 items on desktop, 1 on mobile)
          scrollContainerRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuto]);

  const handleNext = () => {
    setIsAuto(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollContainerRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setIsAuto(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -scrollContainerRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 bg-[#f4f3f2] border-y-2 border-black overflow-hidden">
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
      
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {transferHooks.map((hook, i) => {
            const IconComponent = hook.icon;
            return (
              <div 
                key={hook.title} 
                className="snap-start shrink-0 w-full md:w-[calc(33.333%-1rem)] border-2 border-black bg-white p-6 brutalist-shadow group"
              >
                <div className="mb-4">
                  <IconComponent size={40} className="text-black" strokeWidth={1.5} />
                </div>
                <h3 className={`text-xl font-bold uppercase mb-2 ${spaceMono.className}`}>{hook.title}</h3>
                <p className={`text-base text-[#4c4546] ${spaceMono.className}`}>
                  {hook.desc}
                </p>
                <Link href="/docs" className="mt-6 inline-block text-xs font-bold tracking-[0.1em] uppercase text-black underline group-hover:no-underline cursor-pointer">
                  View Guide
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
