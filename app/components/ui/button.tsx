import React from "react";

export default function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="border-2 border-white bg-black text-white hover:bg-white hover:text-black font-mono p-2" {...props}>
      {children}
    </button>
  );
}
