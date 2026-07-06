import React from "react";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CooldownDocs() {
  return (
    <div className="flex flex-col min-h-full">

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline text-[#5C4E4E] hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Velocity Limiter (Cooldown)</h2>
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
              The Velocity Limiter enforces a strict cooldown period between outgoing token transfers.
              This is often used to prevent flash-loan attacks, sandwich attacks, or rapid dumping of liquidity.
              When enabled, a user must wait a specific number of seconds before initiating another transfer.
            </p>
            <div className="bg-[#f4f3f2] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Important Note:</p>
              <p className="text-sm leading-relaxed mb-4">
                Because the Transfer Hook requires a mutable state account to record the last transfer timestamp,
                enabling this module changes the token to a <strong>deny-by-default</strong> model if the sender lacks a <code>CooldownEntry</code> PDA.
                Users MUST have this PDA initialized before they can transfer tokens if the cooldown period is greater than 0.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
              Using the Dashboard
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              You can set the cooldown period directly from the Library Dashboard:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-6 font-bold">
              <li>Navigate to the <strong>Library</strong> tab.</li>
              <li>Locate the <strong>Velocity Limiter</strong> module.</li>
              <li>Input the cooldown time in <strong>seconds</strong> (e.g., 60 for one minute).</li>
              <li>Click <strong>Save Changes</strong>. Set to 0 to disable.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              To enable cooldowns programmatically, update the policy via the <code>updatePolicy</code> instruction. Additionally, users must initialize a <code>CooldownEntry</code> PDA before their first transfer.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
              {`// 1. Set the cooldown to 60 seconds
await program.methods
  .updatePolicy({ 
    paused: null, 
    allowlistEnabled: null,
    maxTransferAmount: null,
    vestingEnabled: null,
    minTransferAmount: null,
    maxHolderBps: null,
    denylistEnabled: null,
    cooldownSeconds: 60, // 60 seconds
  })
  .accounts({ 
    mint: mintPubkey, 
    policyAuthority: wallet.publicKey, 
  })
  .rpc();

// 2. User must initialize their Cooldown PDA before transferring
await program.methods
  .initCooldownEntry()
  .accounts({
    payer: userWallet.publicKey,
    mint: mintPubkey,
    tokenAccount: userTokenAccountPubkey,
    // systemProgram, etc.
  })
  .rpc();`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
