"use client";

import React, { useState, useEffect } from "react";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import WalletConnect from "../../../components/web3/wallet-connect";
import Card from "../../../components/ui/card";
import Input from "../../../components/ui/input";
import Button from "../../../components/ui/button";
import { useMintPolicy } from "../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../lib/hooks/useJettyProgram";

export default function PolicyPage() {
  const [mintInput, setMintInput] = useState("");
  const [activeMint, setActiveMint] = useState<string | null>(null);

  const { policy, isInitialized, refetch } = useMintPolicy(activeMint);
  const { updatePolicy, loading } = useJettyProgram();

  const [paused, setPaused] = useState(false);
  const [allowlistEnabled, setAllowlistEnabled] = useState(false);
  const [maxTransferAmount, setMaxTransferAmount] = useState("0");

  useEffect(() => {
    if (policy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaused(policy.paused);
      setAllowlistEnabled(policy.allowlistEnabled);
      setMaxTransferAmount(policy.maxTransferAmount.toString());
    }
  }, [policy]);

  const handleSetMint = () => {
    try {
      new PublicKey(mintInput);
      setActiveMint(mintInput);
    } catch {
      alert("Invalid PublicKey");
    }
  };

  const handleSavePolicy = async () => {
    if (!activeMint || !policy) return;
    try {
      let parsedAmount = null;
      if (maxTransferAmount !== policy.maxTransferAmount.toString()) {
        parsedAmount = new BN(maxTransferAmount);
      }
      
      const pausedArg = paused !== policy.paused ? paused : null;
      const allowlistArg = allowlistEnabled !== policy.allowlistEnabled ? allowlistEnabled : null;

      if (pausedArg === null && allowlistArg === null && parsedAmount === null) {
        alert("No changes detected.");
        return;
      }

      await updatePolicy(new PublicKey(activeMint), pausedArg, allowlistArg, parsedAmount);
      refetch();
    } catch (e) {
      console.error(e);
      alert("Failed to update policy.");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex justify-between items-center h-16 px-8 w-full border-b-2 border-black bg-[#D1D1D0]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold font-mono uppercase tracking-widest text-black">Network: Localnet</span>
        </div>
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </header>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Edit Policy Configuration</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Configure compliance rules for your mint
          </p>
        </div>

        <Card>
          <label className="block text-sm font-bold uppercase tracking-widest mb-2">Target Mint</label>
          <div className="flex gap-4">
            <Input 
              placeholder="Enter SPL Token Mint Address..." 
              value={mintInput} 
              onChange={(e) => setMintInput(e.target.value)} 
            />
            <Button onClick={handleSetMint} disabled={loading}>Load</Button>
          </div>
        </Card>

        {activeMint && isInitialized && policy && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Global Pause</h3>
                  <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mt-1">Halt all transfers temporarily</p>
                </div>
                <button 
                  onClick={() => setPaused(!paused)}
                  className={`w-14 h-8 border-2 border-black rounded-none transition-colors ${paused ? "bg-[#5C4E4E]" : "bg-[#D1D1D0]"}`}
                >
                  <div className={`w-6 h-6 border-2 border-black bg-white transition-transform ${paused ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Allowlist Enforcement</h3>
                  <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mt-1">Restrict transfers to verified addresses</p>
                </div>
                <button 
                  onClick={() => setAllowlistEnabled(!allowlistEnabled)}
                  className={`w-14 h-8 border-2 border-black rounded-none transition-colors ${allowlistEnabled ? "bg-[#5C4E4E]" : "bg-[#D1D1D0]"}`}
                >
                  <div className={`w-6 h-6 border-2 border-black bg-white transition-transform ${allowlistEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Max Transfer Amount</h3>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Set to 0 for unlimited volume</p>
              <Input 
                type="number" 
                value={maxTransferAmount} 
                onChange={(e) => setMaxTransferAmount(e.target.value)} 
              />
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePolicy} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}

        {activeMint && !isInitialized && (
          <Card className="bg-[#5C4E4E] text-white">
            <h3 className="text-xl font-bold uppercase mb-2">Not Initialized</h3>
            <p className="text-sm">This mint has no policy configured. Please initialize it on the Dashboard first.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
