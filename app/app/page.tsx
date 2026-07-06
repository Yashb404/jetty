import { DM_Sans } from "next/font/google";
import LandingNav from "../components/layout/landing-nav";
import LandingHero from "../components/layout/landing-hero";
import LandingHooks from "../components/layout/landing-hooks";
import LandingFeatures from "../components/layout/landing-features";
import LandingCta from "../components/layout/landing-cta";
import LandingFooter from "../components/layout/landing-footer";

const dmSans = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"] });

export default function Home() {
  return (
    <div className={`min-h-screen flex flex-col bg-[#f4f3f2] text-[#1a1c1c] ${dmSans.className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .brutalist-border { border: 2px solid #000000; }
        .brutalist-shadow { box-shadow: 4px 4px 0px 0px #000000; transition: transform 0.2s, box-shadow 0.2s; }
        .brutalist-shadow:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px 0px #000000; }
        .brutalist-button-active { transition: transform 0.1s, box-shadow 0.1s; }
        .brutalist-button-active:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px 0px #000000; }
        .hover-invert:hover { background-color: #000000; color: #ffffff; }
        .carousel-item { animation: fadeSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        @keyframes fadeSlide { 0% { opacity: 0; transform: translateY(15px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />

      <LandingNav />
      <main className="flex-grow">
        <LandingHero />
        <LandingHooks />
        <LandingFeatures />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
