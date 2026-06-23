import React from "react";
import WalletConnect from "../../../../components/web3/wallet-connect";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function GlobalPauseDocs() {
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
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Global Pause</h2>
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
              The Global Pause acts as a circuit breaker for your token. When toggled <strong>ON</strong>, 
              Jetty instantly rejects all transfer requests across the entire network. This is critical for 
              stopping exploits, managing migrations, or temporarily pausing trading during highly volatile events.
            </p>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed">
                During a transfer, the Token-2022 program invokes Jetty&apos;s <code>execute</code> instruction. 
                Jetty reads your mint&apos;s specific <code>HookConfig</code> PDA. If the <code>paused</code> 
                flag is true, it immediately returns the <code>TransferPaused</code> custom error (6000), 
                reverting the transaction.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Using the Dashboard
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Enforcing a Global Pause requires zero coding. 
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-6 font-bold">
              <li>Navigate to the <strong>Policy</strong> tab on your Jetty Dashboard.</li>
              <li>Locate the <strong>Global Pause</strong> toggle switch.</li>
              <li>Click the toggle to turn it <strong>ON</strong>.</li>
              <li>Approve the transaction in your connected wallet.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              For developers building custom interfaces, you can update the pause state programmatically by invoking the <code>updatePolicy</code> instruction.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
{`// Pause all transfers programmatically
await program.methods
  .updatePolicy({ 
    paused: true, 
    allowlistEnabled: null, // null leaves existing state unchanged
    maxTransferAmount: null 
  })
  .accounts({ 
    mint: mintPubkey, 
    policyAuthority: wallet.publicKey, 
    hookConfig: hookConfigPda 
  })
  .rpc();`}
            </pre>
          </div>
        </Card>

        <div className="flex justify-end pt-4 border-t-2 border-black">
          <Link href="/docs/volume-limits" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline transition-colors">
            Next: Volume Limits <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
