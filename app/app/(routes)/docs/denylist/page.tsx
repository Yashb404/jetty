import React from "react";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DenylistDocs() {
  return (
    <div className="flex flex-col min-h-full">

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Denylist (Blocklist)</h2>
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
              Unlike the Allowlist module which operates on a default-deny model, the Denylist module operates on a default-allow model. 
              It allows you to explicitly flag and block malicious actors, OFAC-sanctioned addresses, or exploited contracts from transferring your token.
            </p>
            <div className="bg-[#faf9f8] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed">
                During execution, Jetty attempts to fetch a <code>DenylistEntry</code> PDA for both the sender and the receiver. 
                Unlike the Allowlist, if the PDA does <em>not</em> exist, the check safely passes. If the PDA exists and <code>flagged</code> is true, 
                the transaction is aborted with <code>SourceDenylisted</code> (6016) or <code>DestinationDenylisted</code> (6017).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Using the Dashboard
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              You can easily manage your denylist participants through the Jetty UI.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-6 font-bold">
              <li>First, navigate to the <strong>Library</strong> tab and turn the <strong>Denylist</strong> toggle ON.</li>
              <li>Next, navigate to the <strong>Denylist</strong> configuration tab.</li>
              <li>Paste the <strong>Associated Token Account (ATA)</strong> address of the user you want to block.</li>
              <li>Click <strong>Deny Access</strong>. You can unblock them at any time using the <strong>Revoke</strong> button.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              For developers building custom interfaces, you can block a wallet programmatically by invoking the <code>updateDenylist</code> 
              instruction with the <code>true</code> boolean. To unblock, pass <code>false</code>.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
{`// Flag a wallet's Token Account on the Denylist
await program.methods
  .updateDenylist(true) 
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    tokenAccount: targetTokenAccountPubkey,
  })
  .rpc();

// Remove a wallet from the Denylist
// Note: This closes the DenylistEntry PDA and refunds the rent
await program.methods
  .updateDenylist(false) 
  .accounts({
    payer: wallet.publicKey,
    policyAuthority: wallet.publicKey,
    mint: mintPubkey,
    tokenAccount: targetTokenAccountPubkey,
  })
  .rpc();`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
