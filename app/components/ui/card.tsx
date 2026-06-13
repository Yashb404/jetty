import React from "react";

export default function Card({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="border-2 border-white bg-black p-4 font-mono" {...props}>
      {children}
    </div>
  );
}
