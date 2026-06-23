import React from "react";
import WalletConnect from "../../../components/web3/wallet-connect";
import Card from "../../../components/ui/card";
import { ExternalLink } from "lucide-react";

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
            <p className="text-sm leading-relaxed text-[#5C4E4E] font-semibold">
              Because Jetty utilizes the official SPL standard, no custom Rust code is required 
              to enforce complex regulations on your token.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Global Pause
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              The Global Pause acts as a circuit breaker for your token. When toggled <strong>ON</strong>, 
              Jetty instantly rejects all transfer requests across the entire network. 
            </p>
            <p className="text-sm leading-relaxed">
              <strong>Technical Detail:</strong> During a transfer, the Token-2022 program invokes 
              Jetty&apos;s <code>execute</code> instruction. Jetty reads your mint&apos;s specific 
              <code> HookConfig</code> PDA (Program Derived Address). If the <code>paused</code> 
              flag is true, it immediately returns the <code>TransferPaused</code> custom error (6000), 
              reverting the transaction.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Volume Limits
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Volume limits allow you to specify a maximum ceiling for any single transaction. 
              This is commonly used to prevent massive whale dumps or flash-loan attacks on your liquidity pools.
            </p>
            <p className="text-sm leading-relaxed">
              <strong>Technical Detail:</strong> Jetty compares the requested transfer <code>amount</code> 
              against the <code>max_transfer_amount</code> stored in your <code>HookConfig</code> PDA. 
              Because amounts are evaluated in their raw <code>u64</code> format, remember to factor 
              in your token&apos;s decimals (e.g., 1,000 tokens with 6 decimals = 1,000,000,000).
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Allowlist Enforcement
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              When the Allowlist is active, your token effectively becomes a permissioned asset 
              (e.g., a Security Token or RWA). Transfers will strictly fail unless both the 
              <strong> sender</strong> and the <strong> receiver</strong> are explicitly approved.
            </p>
            <p className="text-sm leading-relaxed">
              <strong>Technical Detail:</strong> For each approved wallet, Jetty allocates an 
              <code> AllowlistEntry</code> PDA tied directly to the user&apos;s associated Token Account. 
              During execution, Jetty validates that these PDAs exist, are owned by the Jetty program, 
              and have their <code>active</code> flag set to true.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Security & Authority
            </h3>
            <p className="text-sm leading-relaxed">
              Jetty separates the <strong>Mint Authority</strong> from the <strong>Policy Authority</strong>. 
              This ensures that the wallets responsible for minting new tokens are completely isolated 
              from the compliance wallets responsible for managing rules. The program contains zero 
              <code> unsafe</code> blocks and avoids heap allocations in the execution hot-path to 
              guarantee optimal compute unit consumption and maximum safety.
            </p>
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
