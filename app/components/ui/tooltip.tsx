import React from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      {/* Custom Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block w-56 p-3 bg-white border-2 border-black text-black text-[10px] font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 text-center transition-all">
        {text}
        
        {/* Pointer Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-black"></div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white mt-[-3px]"></div>
      </div>
    </div>
  );
}
