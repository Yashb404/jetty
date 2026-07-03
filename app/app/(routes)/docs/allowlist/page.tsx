import React from "react";
import WalletConnect from "../../../../components/web3/wallet-connect";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AllowlistDocs() {
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
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Allowlist</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Module Guide & Integration
          </p>
        </div>

        <Card className="space-y-6">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              How it Works
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              When the Allowlist is active, your token effectively becomes a permissioned asset 
              (e.g., a Security Token or RWA). Transfers will strictly fail unless both the 
              <strong> sender</strong> and the <strong> receiver</strong> are explicitly approved.
            </p>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed">
                For each approved wallet, Jetty allocates an <code>AllowlistEntry</code> PDA tied 
                directly to the user&apos;s associated Token Account. During execution, Jetty evaluates 
                the Extra Account Meta List passed by the Token-2022 program and verifies that the 
                sender and receiver <code>AllowlistEntry</code> PDAs exist, belong to the Jetty program, 
                and have their <code>active</code> flag set to true. If missing, it throws 
                <code> SourceNotAllowlisted</code> (6002) or <code>DestinationNotAllowlisted</code> (6003).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Using the Dashboard
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              You can easily manage the participants allowed to interact with your token through the Jetty UI.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-6 font-bold">
              <li>First, navigate to the <strong>Library</strong> tab and turn the <strong>Allowlist</strong> toggle ON.</li>
              <li>Next, navigate to the <strong>Allowlist</strong> tab.</li>
              <li>Paste the <strong>Token Account</strong> address of the user you want to add.</li>
              <li>Click <strong>Approve</strong>. You can revoke access at any time using the <strong>Revoke</strong> button.</li>
            </ol>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black mb-6">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Token Accounts vs. Wallets:</p>
              <p className="text-sm leading-relaxed">
                When adding a user, you must input their <strong>Associated Token Account (ATA)</strong> address, NOT their main wallet address. 
                The ATA is the specific sub-account on Solana that holds your custom token. You can find a user&apos;s ATA by looking at their 
                wallet on an explorer like Solscan and checking their token holdings.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              For developers building custom interfaces, you can approve a wallet programmatically by invoking the <code>updateAllowlist</code> 
              instruction with the <code>true</code> boolean. To revoke access, pass <code>false</code>.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
{`// Approve a wallet's Token Account programmatically
await program.methods
  .updateAllowlist(true) 
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    tokenAccount: userTokenAccountPubkey,
  })
  .rpc();

// Revoke a wallet's access
// Note: This closes the AllowlistEntry PDA and refunds the rent
await program.methods
  .updateAllowlist(false) 
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    tokenAccount: userTokenAccountPubkey,
  })
  .rpc();`}
            </pre>
          </div>
        </Card>

        <div className="flex justify-between pt-4 border-t-2 border-black">
          <Link href="/docs/volume-limits" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline transition-colors">
            <ArrowLeft className="w-4 h-4" /> Previous: Volume Limits
          </Link>
        </div>
      </div>
    </div>
  );
}
