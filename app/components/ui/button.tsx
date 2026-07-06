import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  className?: string;
}

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const baseClasses = "font-mono font-bold uppercase tracking-wide border-2 border-black rounded-none transition-colors px-6 py-2.5 flex items-center justify-center gap-2 whitespace-nowrap";
  const primaryClasses = "bg-[#FF5722] text-white hover:bg-black hover:text-white";
  const secondaryClasses = "bg-[#f4f3f2] text-black hover:bg-black hover:text-white";

  const variantClasses = variant === "primary" ? primaryClasses : secondaryClasses;

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
