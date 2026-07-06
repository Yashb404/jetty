import React from "react";

export default function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-[#f4f3f2] border-2 border-black rounded-none px-4 py-3 font-mono text-black placeholder-[#988686] focus:outline-none focus:ring-0 focus:border-black transition-all ${className}`}
      {...props}
    />
  );
}
