import React from "react";
import "./globals.css";
import ClientWalletProvider from "../contexts/ClientWalletProvider";
import AnchorWorkspaceProvider from "../contexts/AnchorProvider";
import Sidebar from "../components/layout/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-[#D1D1D0] text-black">
        <ClientWalletProvider>
          <AnchorWorkspaceProvider>
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {children}
            </main>
          </AnchorWorkspaceProvider>
        </ClientWalletProvider>
      </body>
    </html>
  );
}
