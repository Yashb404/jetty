import React from "react";
import WalletConnect from "../../../components/web3/wallet-connect";
import Card from "../../../components/ui/card";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="flex justify-between items-center h-16 px-8 w-full border-b-2 border-black bg-[#D1D1D0]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold font-mono uppercase tracking-widest text-black">Network: Devnet</span>
        </div>
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </header>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Documentation</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Understanding the Jetty Compliance Controller
          </p>
        </div>

        <Card className="space-y-6">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              What is Jetty?
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Jetty is a smart contract (program) deployed on Solana that acts as a universal, 
              no-code compliance layer for SPL Token-2022. By pointing your token&apos;s 
              <strong> Transfer Hook</strong> extension to the Jetty program ID, every transfer 
              of your token is intercepted and evaluated against the rules you configure here.
            </p>
            <p className="text-sm leading-relaxed mb-4">
              Because Jetty utilizes the official SPL standard, no custom Rust code is required 
              to enforce complex regulations on your token.
            </p>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Under the Hood:</p>
              <p className="text-sm leading-relaxed">
                During a transfer, the Token-2022 program invokes Jetty&apos;s <code>execute</code> instruction. 
                Jetty reads your mint&apos;s specific <code>HookConfig</code> PDA (Program Derived Address). 
                If any compliance flags fail, it immediately reverts the transaction.
              </p>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-xl font-bold uppercase tracking-wide mb-4">Getting Started</h3>
          <Link href="/docs/quick-guide" className="block mb-8">
            <Card className="hover:bg-black hover:text-white transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black">
              <div>
                <h4 className="font-bold uppercase tracking-wide mb-2 text-xl">Quick Start Guide</h4>
                <p className="text-sm group-hover:text-gray-300 text-[#5C4E4E]">A comprehensive step-by-step walkthrough of the Frontend Dashboard.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold mt-4 sm:mt-0">
                Start Here <ArrowRight className="w-5 h-5" />
              </div>
            </Card>
          </Link>

          <h3 className="text-xl font-bold uppercase tracking-wide mb-4">Compliance Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/docs/global-pause" className="block">
              <Card className="h-full hover:bg-black hover:text-white transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <h4 className="font-bold uppercase tracking-wide mb-2 text-lg">Global Pause</h4>
                  <p className="text-sm mb-4 group-hover:text-gray-300 text-[#5C4E4E]">Instantly freeze all token transfers across the entire network.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  View Guide <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>
            
            <Link href="/docs/volume-limits" className="block">
              <Card className="h-full hover:bg-black hover:text-white transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <h4 className="font-bold uppercase tracking-wide mb-2 text-lg">Volume Limits</h4>
                  <p className="text-sm mb-4 group-hover:text-gray-300 text-[#5C4E4E]">Set a maximum ceiling for any single transaction.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  View Guide <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            <Link href="/docs/allowlist" className="block">
              <Card className="h-full hover:bg-black hover:text-white transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <h4 className="font-bold uppercase tracking-wide mb-2 text-lg">Allowlist</h4>
                  <p className="text-sm mb-4 group-hover:text-gray-300 text-[#5C4E4E]">Restrict transfers strictly to pre-approved wallets.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  View Guide <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="space-y-4 border-yellow-400">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-yellow-400 pb-2 mb-4 text-yellow-900">
              Security Architecture: Authority Rotation
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              To prevent catastrophic human error, the Jetty smart contract enforces a strict <strong>"Handshake Rule"</strong> when transferring policy ownership (Policy Authority) to a new wallet address.
            </p>
            <p className="text-sm leading-relaxed mb-4">
              If an administrator accidentally misspells a public key when assigning a new authority, control of the compliance rules would be lost forever. To prevent this, the underlying Rust contract strictly requires <strong>both</strong> the current authority and the new incoming authority to cryptographically sign the rotation transaction. 
            </p>
            <div className="bg-yellow-50 p-4 border-2 border-yellow-400 rounded-none text-yellow-800">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Multi-Sig Workflows</p>
              <p className="text-sm leading-relaxed">
                Currently, rotating authority to a cold wallet or a second administrator requires executing a multi-sig partially signed transaction (PSBT). While the smart contract strictly enforces this safety measure today, full UI support for generating and sharing partially signed transactions directly through this Dashboard will be implemented in a future update.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
            Relevant Resources
          </h3>
          <div className="flex flex-col gap-3">
            <a 
              href="https://spl.solana.com/token-2022" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Solana Token-2022 Overview
            </a>
            <a 
              href="https://spl.solana.com/token-2022/extensions#transfer-hooks" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Transfer Hook Extension Docs
            </a>
            <a 
              href="https://www.anchor-lang.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Anchor Framework
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
