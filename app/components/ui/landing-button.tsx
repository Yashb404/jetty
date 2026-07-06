import Link from "next/link";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

interface LandingButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "accent" | "white";
  children: React.ReactNode;
  className?: string;
}

export default function LandingButton({ href, variant = "primary", children, className = "" }: LandingButtonProps) {
  let variantClasses = "";
  if (variant === "primary") {
    variantClasses = "bg-black text-white border-2 border-black hover:bg-[#1a1a1a] transition-colors";
  } else if (variant === "secondary") {
    variantClasses = "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white transition-colors";
  } else if (variant === "accent") {
    variantClasses = "bg-[#5C4E4E] border-2 border-black text-white hover:bg-black transition-colors";
  } else if (variant === "white") {
    variantClasses = "bg-[#faf9f8] text-black border-2 border-[#faf9f8] hover:bg-black hover:text-[#faf9f8] transition-colors";
  }

  return (
    <Link 
      href={href} 
      className={`inline-block text-center font-bold tracking-[0.1em] uppercase brutalist-button-active ${variantClasses} ${spaceMono.className} ${className}`}
    >
      {children}
    </Link>
  );
}
