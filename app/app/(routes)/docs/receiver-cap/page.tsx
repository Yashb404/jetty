import React from "react";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReceiverCapDocs() {
  return (
    <div className="flex flex-col min-h-full">

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Receiver Cap</h2>
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
              The Receiver Cap module limits the maximum percentage of the total token supply that any single wallet can hold.
              This prevents whales from accumulating a dangerous percentage of governance tokens or liquidity.
            </p>
            <div className="bg-[#f4f3f2] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed mb-4">
                The cap is measured in <strong>Basis Points (BPS)</strong> relative to the on-chain total supply of the mint.
                (100 BPS = 1%, 10,000 BPS = 100%).
              </p>
              <p className="text-sm leading-relaxed">
                Because of the Token-2022 Transfer Hook execution timing, Jetty is invoked <em>after</em> the tokens have actually been transferred.
                Jetty examines the destination account&apos;s current balance, recalculates the maximum allowed balance via <code>(supply * max_bps) / 10000</code>,
                and rolls back the transaction with <code>ExceedsHolderCap</code> (6014) if the cap is exceeded.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              To set the receiver cap programmatically, pass the limit in <strong>basis points</strong> to the <code>updatePolicy</code> instruction.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
              {`// Set the Receiver Cap to 1% of the total supply (100 basis points)
await program.methods
  .updatePolicy({ 
    paused: null, 
    allowlistEnabled: null,
    maxTransferAmount: null,
    vestingEnabled: null,
    minTransferAmount: null,
    maxHolderBps: 100, // 1% = 100 bps
    denylistEnabled: null,
    cooldownSeconds: null,
  })
  .accounts({ 
    mint: mintPubkey, 
    policyAuthority: wallet.publicKey, 
  })
  .rpc();`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
