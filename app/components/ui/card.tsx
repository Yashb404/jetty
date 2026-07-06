import React from "react";

export default function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-2 border-black bg-[#faf9f8] p-6 font-mono text-black rounded-none ${className}`} {...props}>
      {children}
    </div>
  );
}
