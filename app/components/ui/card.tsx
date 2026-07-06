import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark";
}

export default function Card({ children, className = "", variant = "default", ...props }: CardProps) {
  const baseClasses = "border-2 border-black p-6 rounded-none brutalist-shadow";
  const variantClasses = variant === "dark" 
    ? "bg-[#5C4E4E] text-white" 
    : "bg-[#faf9f8] text-black";

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
