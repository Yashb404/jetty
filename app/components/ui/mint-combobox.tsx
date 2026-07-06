"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRecentMints } from '../../lib/hooks/useRecentMints';

interface MintComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function MintCombobox({ value, onChange, placeholder = "Enter SPL Token Mint Address..." }: MintComboboxProps) {
  const { recentMints } = useRecentMints();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMints = recentMints.filter(mint => mint.toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        className="w-full bg-white border-2 border-black px-4 py-2 font-mono text-black placeholder:text-[#988686] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && filteredMints.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border-2 border-black max-h-48 overflow-y-auto shadow-lg">
          {filteredMints.map((mint, idx) => (
            <li 
              key={idx}
              className="px-4 py-2 hover:bg-[#faf9f8] cursor-pointer font-mono text-sm text-black border-b border-[#faf9f8] last:border-0"
              onMouseDown={(e) => {
                // use onMouseDown instead of onClick to prevent onBlur from firing first
                e.preventDefault();
                onChange(mint);
                setIsOpen(false);
              }}
            >
              {mint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
