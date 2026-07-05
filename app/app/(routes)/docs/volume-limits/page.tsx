import React from "react";
import WalletConnect from "../../../../components/web3/wallet-connect";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function VolumeLimitsDocs() {
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
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Volume Limits</h2>
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
              The Volume Limiter acts as a circuit breaker for your token. When activated, it enforces a 
              strict ceiling on the number of tokens that can be transferred in a single transaction.
            </p>
            <p className="text-sm leading-relaxed mb-4 font-bold text-yellow-900 bg-yellow-100 p-2 border border-yellow-400">
              Note: Volume Limits restrict the amount of a single transfer. If you want to restrict the total amount 
              a user can HOLD (as a percentage of the total supply), use the Receiver Cap module instead.
            </p>
            <p className="text-sm leading-relaxed mb-4">
              This is commonly used to prevent massive whale dumps or flash-loan attacks on your liquidity pools.
            </p>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed">
                Jetty compares the requested transfer <code>amount</code> against the 
                <code> max_transfer_amount</code> stored in your <code>HookConfig</code> PDA. 
                Because amounts are evaluated in their raw <code>u64</code> format, remember to factor 
                in your token&apos;s decimals (e.g., 1,000 tokens with 6 decimals = 1,000,000,000). 
                If the amount exceeds the limit, it throws the <code>ExceedsVolumeLimit</code> error (6001).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Using the Dashboard
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              You can set the Volume Limit directly from the Dashboard without writing a line of code.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-6 font-bold">
              <li>Navigate to the <strong>Library</strong> tab on your Jetty Dashboard.</li>
              <li>Locate the <strong>Volume Limit</strong> input field.</li>
              <li>Enter your desired maximum transfer amount.</li>
              <li>Click the <strong>Set Limit</strong> button and approve the transaction.</li>
            </ol>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black mb-6">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Metric Calculation:</p>
              <p className="text-sm leading-relaxed">
                Tokens on Solana are stored in their smallest atomic unit (like Lamports for SOL). 
                If your token has <strong>6 decimals</strong>, and you want to limit transfers to <strong>1,000 tokens</strong>, 
                you must enter <code>1000000000</code> in the input field.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              For developers building custom interfaces, you can update the volume limit programmatically by passing a <code>BN</code> (BigNumber) to the <code>updatePolicy</code> instruction.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
{`import { BN } from "@coral-xyz/anchor";

// Set a volume limit of 10,000 tokens (assuming 6 decimals) programmatically
const maxAmount = new BN(10_000).mul(new BN(10).pow(new BN(6)));

await program.methods
  .updatePolicy({ 
    paused: null, 
    allowlistEnabled: null,
    maxTransferAmount: maxAmount,
    vestingEnabled: null,
    minTransferAmount: null,
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

        <div className="flex justify-between pt-4 border-t-2 border-black">
          <Link href="/docs/global-pause" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline transition-colors">
            <ArrowLeft className="w-4 h-4" /> Previous: Global Pause
          </Link>
          <Link href="/docs/allowlist" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline transition-colors">
            Next: Allowlist <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
