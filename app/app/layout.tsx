import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import ClientWalletProvider from "../contexts/ClientWalletProvider";
import AnchorWorkspaceProvider from "../contexts/AnchorProvider";
import MintProvider from "../contexts/MintProvider";
import { Toaster } from "react-hot-toast";
import { Space_Mono, JetBrains_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "Jetty — Transfer Hook Manager for Solana Token-2022",
  description:
    "Configure modular, on-chain compliance policies for Solana Token-2022 mints — allowlists, denylists, vesting, volume limits, and more — without writing custom Rust.",
  openGraph: {
    title: "Jetty — Transfer Hook Manager for Solana Token-2022",
    description:
      "Configure modular, on-chain compliance policies for Solana Token-2022 mints without writing custom Rust.",
    type: "website",
  },
  verification: {
    google: "YdwJopmySwfEy_fQw0w5BKfEl97xT9yWlYw6K1NU-O8",
  },
};

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
      <head>
        <meta name="google-site-verification" content="YdwJopmySwfEy_fQw0w5BKfEl97xT9yWlYw6K1NU-O8" />
      </head>
      <body className="bg-[#f4f3f2] text-black">
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
