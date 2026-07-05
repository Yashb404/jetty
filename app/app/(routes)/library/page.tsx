"use client";

import React, { useState, useEffect } from "react";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import WalletConnect from "../../../components/web3/wallet-connect";
import Card from "../../../components/ui/card";
import Input from "../../../components/ui/input";
import Button from "../../../components/ui/button";
import MintCombobox from "../../../components/ui/mint-combobox";
import { useMintPolicy } from "../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../lib/hooks/useJettyProgram";
import { useMintContext } from "../../../contexts/MintProvider";
import Toast from "../../../components/ui/toast";


export default function LibraryPage() {
  const { activeMint, setActiveMint } = useMintContext();
  const [mintInput, setMintInput] = useState(activeMint || "");

  useEffect(() => {
    if (activeMint) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMintInput(activeMint);
    }
  }, [activeMint]);

  const { policy, isInitialized, refetch } = useMintPolicy(activeMint);
  const { updatePolicy, loading } = useJettyProgram();

  const [paused, setPaused] = useState(false);
  const [allowlistEnabled, setAllowlistEnabled] = useState(false);
  const [maxTransferAmount, setMaxTransferAmount] = useState("0");
  const [vestingEnabled, setVestingEnabled] = useState(false);
  const [minTransferAmount, setMinTransferAmount] = useState("0");
  const [maxHolderBps, setMaxHolderBps] = useState("0");
  const [denylistEnabled, setDenylistEnabled] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState("0");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (policy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaused(policy.paused);
      setAllowlistEnabled(policy.allowlistEnabled);
      setMaxTransferAmount(policy.maxTransferAmount.toString());
      setVestingEnabled(policy.vestingEnabled);
      setMinTransferAmount(policy.minTransferAmount.toString());
      setMaxHolderBps(policy.maxHolderBps.toString());
      setDenylistEnabled(policy.denylistEnabled);
      setCooldownSeconds(policy.cooldownSeconds.toString());
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
      let parsedMaxAmount = null;
      if (maxTransferAmount !== policy.maxTransferAmount.toString()) {
        parsedMaxAmount = new BN(maxTransferAmount);
      }
      
      let parsedMinAmount = null;
      if (minTransferAmount !== policy.minTransferAmount.toString()) {
        parsedMinAmount = new BN(minTransferAmount);
      }
      
      const pausedArg = paused !== policy.paused ? paused : null;
      const allowlistArg = allowlistEnabled !== policy.allowlistEnabled ? allowlistEnabled : null;
      const vestingArg = vestingEnabled !== policy.vestingEnabled ? vestingEnabled : null;
      const bpsArg = maxHolderBps !== policy.maxHolderBps.toString() ? parseInt(maxHolderBps, 10) : null;
      const denylistArg = denylistEnabled !== policy.denylistEnabled ? denylistEnabled : null;
      const cooldownArg = cooldownSeconds !== policy.cooldownSeconds.toString() ? parseInt(cooldownSeconds, 10) : null;

      if (
        pausedArg === null && 
        allowlistArg === null && 
        parsedMaxAmount === null &&
        vestingArg === null &&
        parsedMinAmount === null &&
        bpsArg === null &&
        denylistArg === null &&
        cooldownArg === null
      ) {
        setStatusMessage({ type: "info", text: "No changes detected." });
        return;
      }

      await updatePolicy(
        new PublicKey(activeMint), 
        pausedArg, 
        allowlistArg, 
        parsedMaxAmount,
        vestingArg,
        parsedMinAmount,
        bpsArg,
        denylistArg,
        cooldownArg
      );
      refetch();
      setStatusMessage({ type: "success", text: "Policy updated successfully." });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: "Failed to update policy." });
    }
  };

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

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Extension Library</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Enable or disable compliance modules for your target mint
          </p>
        </div>

        <Card>
          <label className="block text-sm font-bold uppercase tracking-widest mb-2">Target Mint</label>
          <div className="flex gap-4">
            <MintCombobox 
              placeholder="Enter SPL Token Mint Address..." 
              value={mintInput} 
              onChange={(val) => setMintInput(val)} 
            />
            <Button onClick={handleSetMint} disabled={loading}>Load</Button>
          </div>
        </Card>

        {activeMint && isInitialized && policy && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Global Pause Module</h3>
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
                  <h3 className="text-lg font-bold uppercase tracking-widest">Allowlist Module</h3>
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
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Volume Limiter Module</h3>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Max transfer amount (Set to 0 to disable volume limits)</p>
              <Input 
                type="number" 
                min="0"
                step="1"
                value={maxTransferAmount} 
                onChange={(e) => setMaxTransferAmount(e.target.value)} 
              />
            </Card>

            <Card>
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Anti-Dust Module</h3>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Minimum transfer amount (Set to 0 to disable minimum limits)</p>
              <Input 
                type="number" 
                min="0"
                step="1"
                value={minTransferAmount} 
                onChange={(e) => setMinTransferAmount(e.target.value)} 
              />
            </Card>

            <Card>
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Receiver Balance Cap</h3>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Max Holder Basis Points (0 = no cap, 10000 = 100% of supply)</p>
              <Input 
                type="number" 
                min="0"
                max="10000"
                step="1"
                value={maxHolderBps} 
                onChange={(e) => setMaxHolderBps(e.target.value)} 
              />
            </Card>
            
            <Card>
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Velocity Limiter (Cooldown)</h3>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Seconds required between outgoing transfers (0 = disable)</p>
              <Input 
                type="number" 
                min="0"
                step="1"
                value={cooldownSeconds} 
                onChange={(e) => setCooldownSeconds(e.target.value)} 
              />
            </Card>

            <Card>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Denylist Module</h3>
                  <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mt-1">Block specific wallets from transferring tokens</p>
                </div>
                <button 
                  onClick={() => setDenylistEnabled(!denylistEnabled)}
                  className={`w-14 h-8 border-2 border-black rounded-none transition-colors ${denylistEnabled ? "bg-[#5C4E4E]" : "bg-[#D1D1D0]"}`}
                >
                  <div className={`w-6 h-6 border-2 border-black bg-white transition-transform ${denylistEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Vesting / Lockup</h3>
                  <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mt-1">Enforce time-locked release schedules</p>
                </div>
                <button 
                  onClick={() => setVestingEnabled(!vestingEnabled)}
                  className={`w-14 h-8 border-2 border-black rounded-none transition-colors ${vestingEnabled ? "bg-[#5C4E4E]" : "bg-[#D1D1D0]"}`}
                >
                  <div className={`w-6 h-6 border-2 border-black bg-white transition-transform ${vestingEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </Card>

            {statusMessage && (
              <Toast
                type={statusMessage.type}
                message={statusMessage.text}
                onClose={() => setStatusMessage(null)}
              />
            )}

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
