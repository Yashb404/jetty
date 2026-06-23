import React from "react";
import WalletConnect from "../../../../components/web3/wallet-connect";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

export default function QuickGuideDocs() {
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
              <strong>Persistence:</strong> Once you load a mint, Jetty will automatically persist it across all tabs 
              (Policy, Activity) so you don&apos;t have to keep pasting it.
            </p>
            <p className="text-sm leading-relaxed text-[#5C4E4E] font-bold">
              Tip: If you don&apos;t have a mint yet, you can create one instantly by clicking &quot;Create Test Mint&quot; on the Dashboard!
            </p>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 3: Initialize Policy & Meta List
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Before you can enforce rules, you must initialize the on-chain structures. If you load a brand new mint, 
              you will see two critical setup buttons on your Dashboard:
            </p>
            <ul className="list-disc pl-5 space-y-4 text-sm leading-relaxed">
              <li>
                <strong>Initialize Policy:</strong> This allocates the <code>HookConfig</code> PDA for your mint. 
                This account stores your actual rules (like whether your token is globally paused).
              </li>
              <li>
                <strong>Initialize Meta List:</strong> This allocates the <code>ExtraAccountMetaList</code> PDA. 
                The Solana Token-2022 program strictly requires this list to know which additional accounts to forward to Jetty during a transfer.
              </li>
            </ul>
            <p className="text-sm font-bold mt-4">You must complete both steps sequentially before managing rules.</p>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 4: Configure Rules
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Navigate to the <strong>Policy</strong> tab. From here, you can manage your compliance rules entirely via the UI:
            </p>
            <ul className="list-disc pl-5 space-y-4 text-sm leading-relaxed">
              <li>
                <strong>Global Pause:</strong> Simply toggle the switch ON/OFF and approve the transaction. When ON, all transfers are frozen.
              </li>
              <li>
                <strong>Volume Limits:</strong> Enter a numeric limit. <strong>Important Metric Note:</strong> Values must be entered in 
                raw format based on your token&apos;s decimals. For example, if your token has 6 decimals, a limit of 1,000 tokens 
                must be entered as <code>1000000000</code>.
              </li>
              <li>
                <strong>Allowlist Toggle:</strong> Turn this ON if you want to strictly restrict transfers to pre-approved participants.
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Step 5: Manage Allowlist Accounts
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Navigate to the <strong>Activity</strong> tab to add specific users to your Allowlist. 
            </p>
            <p className="text-sm leading-relaxed bg-[#D1D1D0] p-4 border-2 border-black mb-4">
              <strong>CRITICAL: Token Accounts vs. Wallet Addresses</strong><br /><br />
              When adding a user, you must input their <strong>Associated Token Account (ATA)</strong> address, NOT their main wallet address. 
              The ATA is the specific sub-account that holds your custom token. You can easily find a user&apos;s ATA by looking at their 
              wallet on an explorer like Solscan and checking their token holdings.
            </p>
            <p className="text-sm leading-relaxed">
              Paste the ATA, click <strong>Approve</strong>, and Jetty will securely allocate an <code>AllowlistEntry</code> for that account!
            </p>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t-2 border-black">
          <Link href="/docs/global-pause" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline transition-colors">
            Next: Global Pause Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
