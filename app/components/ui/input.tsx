import React from "react";

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className="border-2 border-white bg-black text-white font-mono p-2" {...props} />
  );
}
