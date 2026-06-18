import React from "react";

export default function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-2 border-black bg-[#D1D1D0] p-6 font-mono text-black rounded-none ${className}`} {...props}>
      {children}
    </div>
  );
}
