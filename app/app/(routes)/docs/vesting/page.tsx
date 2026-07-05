import React from "react";
import WalletConnect from "../../../../components/web3/wallet-connect";
import Card from "../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VestingDocs() {
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
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Vesting / Lockup</h2>
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
              The Vesting module allows you to lock tokens in a specific user&apos;s wallet until a predefined timestamp. 
              Before the unlock timestamp is reached, the user cannot transfer any tokens out of their account, though they can still receive tokens.
            </p>
            <div className="bg-[#D1D1D0] p-4 border-2 border-black rounded-none">
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">Technical Detail:</p>
              <p className="text-sm leading-relaxed">
                When active, Jetty checks if a <code>VestingEntry</code> PDA exists for the sender&apos;s token account. 
                If it does, Jetty compares the Solana clock&apos;s current Unix timestamp against the entry&apos;s <code>unlock_timestamp</code>. 
                If the current time is less than the unlock time, it reverts with <code>TokensLocked</code> (6012).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-4 text-[#5C4E4E]">
              Under the Hood: Contract Integration
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-[#5C4E4E]">
              For developers building custom interfaces, you can enforce a vesting lock programmatically by invoking the <code>set_vesting_lock</code> 
              instruction with a Unix timestamp.
            </p>
            <pre className="bg-black text-white p-4 overflow-x-auto text-sm leading-relaxed">
{`// Set a vesting lock on a Token Account
await program.methods
  .setVestingLock(new anchor.BN(unlockTimestamp)) 
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
      </div>
    </div>
  );
}
