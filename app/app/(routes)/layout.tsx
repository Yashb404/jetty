import React from "react";
import Sidebar from "../../components/layout/sidebar";
import FloatingWallet from "../../components/web3/floating-wallet";

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf9f8]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full relative">
        <FloatingWallet />
        {children}
      </main>
    </div>
  );
}
