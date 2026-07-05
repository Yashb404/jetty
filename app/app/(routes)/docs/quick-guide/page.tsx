import React from "react";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function QuickGuideDocs() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Quick Start Guide</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            A step-by-step walkthrough to securing your token
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 1: Connect Wallet
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              To interact with the Jetty dashboard, you must connect a Solana wallet (e.g., Phantom, Solflare). 
              Ensure your wallet is set to <strong>Devnet</strong>.
            </p>
            <p className="text-sm leading-relaxed mb-4">
              If your Devnet balance is empty, you need SOL to pay for transaction fees and rent. 
              You can easily airdrop yourself some Devnet SOL below:
            </p>
            <a 
              href="https://faucet.solana.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Solana Devnet Faucet <ExternalLink className="w-4 h-4" />
            </a>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 2: Create or Load a Mint
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Navigate to the <strong>Dashboard</strong> page. If you already have a Token-2022 mint configured 
              with Jetty&apos;s Transfer Hook, paste its address into the <em>Target Mint</em> input and click <strong>Load</strong>. 
            </p>
            <p className="text-sm leading-relaxed mb-4">
              <strong>Persistence:</strong> Once you load a mint, Jetty will automatically persist it across all modules 
              so you don&apos;t have to keep pasting it.
            </p>
            <p className="text-sm leading-relaxed text-[#5C4E4E] font-bold">
              Tip: If you don&apos;t have a mint yet, you can create one instantly by clicking &quot;Create Token-2022 Mint&quot; on the Dashboard!
            </p>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 3: Initialize Policy & Meta List
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Before you can enforce rules, the on-chain structures must be initialized. 
              <strong> If you used the "Create Token-2022 Mint" button on the Dashboard, this is already done for you!</strong> Our system automatically batches the Mint Creation, Policy Initialization, and Meta List generation into a single transaction to save you compute units and base fees.
            </p>
            <p className="text-sm leading-relaxed mb-4">
              However, if you loaded a pre-existing Token-2022 mint generated from a CLI or external tool, you will see two critical setup buttons on your Dashboard:
            </p>
            <ul className="list-disc pl-5 space-y-4 text-sm leading-relaxed">
              <li>
                <strong>Initialize Policy:</strong> Allocates the <code>HookConfig</code> PDA to store your rules.
              </li>
              <li>
                <strong>Initialize Meta List:</strong> Allocates the <code>ExtraAccountMetaList</code> PDA so the Token-2022 program knows how to route accounts during transfers.
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 4: Configure Rules
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Navigate to the <strong>Library</strong> tab. From here, you can manage 7 distinct compliance rules entirely via the UI:
            </p>
            <ul className="list-disc pl-5 space-y-4 text-sm leading-relaxed">
              <li>
                <strong>Global Pause:</strong> Simply toggle the switch ON/OFF and approve the transaction. When ON, all transfers are frozen.
              </li>
              <li>
                <strong>Numeric Limits:</strong> Enter limits for Volume (Max Transfer), Anti-Dust (Min Transfer), or Receiver Cap. <strong>Important Metric Note:</strong> Values must be entered in 
                raw format based on your token&apos;s decimals. For example, if your token has 6 decimals, a limit of 1,000 tokens 
                must be entered as <code>1000000000</code>.
              </li>
              <li>
                <strong>Module Toggles:</strong> Turn ON Allowlist, Denylist, Vesting, or Cooldowns. These require further configuration on their dedicated pages (e.g., assigning specific users).
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 5: Manage Account Policies
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              If you enabled advanced modules like Allowlist, Denylist, or Vesting, you can configure individual users by navigating to their respective configuration pages (e.g., <strong>Hooks &gt; Allowlist</strong>).
            </p>
            <p className="text-sm leading-relaxed bg-[#D1D1D0] p-4 border-2 border-black mb-4">
              <strong>CRITICAL: Token Accounts vs. Wallet Addresses</strong><br /><br />
              When configuring a user, you must input their <strong>Associated Token Account (ATA)</strong> address, NOT their main wallet address. 
              The ATA is the specific sub-account that holds your custom token. You can easily find a user&apos;s ATA by looking at their 
              wallet on an explorer like Solscan and checking their token holdings.
            </p>
            <p className="text-sm leading-relaxed">
              Paste the ATA, click <strong>Approve / Deny / Lock</strong>, and Jetty will securely allocate the corresponding PDA for that account!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
