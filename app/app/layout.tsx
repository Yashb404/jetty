import React from "react";
import "./globals.css";
import ClientWalletProvider from "../contexts/ClientWalletProvider";
import AnchorWorkspaceProvider from "../contexts/AnchorProvider";
import MintProvider from "../contexts/MintProvider";
import Sidebar from "../components/layout/sidebar";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-[#D1D1D0] text-black overflow-hidden">
        <ClientWalletProvider>
          <AnchorWorkspaceProvider>
            <MintProvider>
              <Sidebar />
              <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full relative">
                {children}
              </main>
              <Toaster position="bottom-right" />
            </MintProvider>
          </AnchorWorkspaceProvider>
        </ClientWalletProvider>
      </body>
    </html>
  );
}
