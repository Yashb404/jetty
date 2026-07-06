import React from "react";
import "./globals.css";
import ClientWalletProvider from "../contexts/ClientWalletProvider";
import AnchorWorkspaceProvider from "../contexts/AnchorProvider";
import MintProvider from "../contexts/MintProvider";
import { Toaster } from "react-hot-toast";
import { Space_Mono, JetBrains_Mono } from "next/font/google";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceMono.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-[#faf9f8] text-black">
        <ClientWalletProvider>
          <AnchorWorkspaceProvider>
            <MintProvider>
              {children}
              <Toaster position="bottom-right" />
            </MintProvider>
          </AnchorWorkspaceProvider>
        </ClientWalletProvider>
      </body>
    </html>
  );
}
