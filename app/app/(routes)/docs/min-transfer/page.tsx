import React from "react";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MinTransferDocs() {
  return (
    <div className="flex flex-col min-h-full">

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Anti-Dust (Min Transfer)</h2>
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
              The Anti-Dust module prevents spam and low-value transactions by enforcing a minimum transfer threshold. 
              Any transfer attempt below the configured minimum amount will be rejected by the contract.
            </p>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed">
                When <code>min_transfer_amount</code> is strictly greater than 0, the program intercepts the transfer. 
                If the transfer <code>amount</code> is less than the minimum (and not strictly 0, which is allowed for wallet closure operations), 
                the program reverts with <code>BelowMinimumTransferAmount</code> (6013).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Using the Dashboard
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              You can set the minimum transfer limit directly from the Library Dashboard:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-6 font-bold">
              <li>Navigate to the <strong>Library</strong> tab.</li>
              <li>Locate the <strong>Anti-Dust Module</strong> card.</li>
              <li>Input the minimum number of base tokens (in lowest decimals).</li>
              <li>Click <strong>Save Changes</strong>. Set to 0 to disable.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              To set the minimum transfer amount programmatically, pass a <code>BN</code> (BigNumber) to the <code>updatePolicy</code> instruction.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
{`import { BN } from "@coral-xyz/anchor";

// Require all transfers to be at least 1 token (assuming 6 decimals)
const minAmount = new BN(1).mul(new BN(10).pow(new BN(6)));

await program.methods
  .updatePolicy({ 
    paused: null, 
    allowlistEnabled: null,
    maxTransferAmount: null,
    vestingEnabled: null,
    minTransferAmount: minAmount,
    maxHolderBps: null,
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
