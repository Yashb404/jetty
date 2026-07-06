"use client";

import React, { useEffect } from "react";

interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  /** Auto-dismiss after this many milliseconds. Defaults to 4000. */
  duration?: number;
}

const STYLE_MAP: Record<ToastProps["type"], string> = {
  success: "bg-black text-white border-black",
  error: "bg-[#5C4E4E] text-white border-[#5C4E4E]",
  info: "bg-[#faf9f8] text-black border-black",
};

export default function Toast({ type, message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 border-2 font-mono text-sm font-bold uppercase tracking-widest ${STYLE_MAP[type]}`}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
