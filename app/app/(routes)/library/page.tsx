"use client";

import React, { useState, useEffect } from "react";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

import Input from "../../../components/ui/input";
import Button from "../../../components/ui/button";
import MintCombobox from "../../../components/ui/mint-combobox";
import { useMintPolicy } from "../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../lib/hooks/useJettyProgram";
import { useMintContext } from "../../../contexts/MintProvider";
import Toast from "../../../components/ui/toast";
import Link from "next/link";


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
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedWarnings, setDismissedWarnings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem("jetty-dismissed-warnings");
    if (saved) {
      try {
        setTimeout(() => setDismissedWarnings(JSON.parse(saved)), 0);
      } catch (e) {
        console.error("Failed to parse dismissed warnings", e);
      }
    }
  }, []);

  const dismissWarning = (id: string) => {
    const next = { ...dismissedWarnings, [id]: true };
    setDismissedWarnings(next);
    localStorage.setItem("jetty-dismissed-warnings", JSON.stringify(next));
  };

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
      setStatusMessage({ type: "error", text: "Invalid PublicKey" });
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

      // Logic Validation: Min > Max
      if (parsedMinAmount !== null || parsedMaxAmount !== null) {
        const finalMin = parsedMinAmount || new BN(policy.minTransferAmount);
        const finalMax = parsedMaxAmount || new BN(policy.maxTransferAmount);
        if (finalMax.gt(new BN(0)) && finalMin.gt(finalMax)) {
          setStatusMessage({ type: "error", text: "Minimum Transfer Amount cannot be greater than Maximum Transfer Amount." });
          return;
        }
      }

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
      
      // Delay refetch slightly to ensure the RPC node returns the fresh account state
      await new Promise((resolve) => setTimeout(resolve, 1500));
      refetch();
      
      setStatusMessage({ type: "success", text: "Policy updated successfully." });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: "Failed to update policy." });
    }
  };

  const isPending = (type: string) => {
    if (!policy) return false;
    if (type === "pause") return paused !== policy.paused;
    if (type === "allowlist") return allowlistEnabled !== policy.allowlistEnabled;
    if (type === "denylist") return denylistEnabled !== policy.denylistEnabled;
    if (type === "vesting") return vestingEnabled !== policy.vestingEnabled;
    if (type === "max_amount") return maxTransferAmount !== policy.maxTransferAmount.toString();
    if (type === "min_amount") return minTransferAmount !== policy.minTransferAmount.toString();
    if (type === "max_bps") return maxHolderBps !== policy.maxHolderBps.toString();
    if (type === "cooldown") return cooldownSeconds !== policy.cooldownSeconds.toString();
    return false;
  };

  const hasUnsavedChanges = [
    "pause", "allowlist", "denylist", "vesting", "max_amount", "min_amount", "max_bps", "cooldown"
  ].some(isPending);

  const isInstalled = (type: string) => {
    if (isPending(type)) return true;
    if (!policy) return false;
    if (type === "pause") return policy.paused;
    if (type === "allowlist") return policy.allowlistEnabled;
    if (type === "denylist") return policy.denylistEnabled;
    if (type === "vesting") return policy.vestingEnabled;
    if (type === "max_amount") return policy.maxTransferAmount.toString() !== "0";
    if (type === "min_amount") return policy.minTransferAmount.toString() !== "0";
    if (type === "max_bps") return policy.maxHolderBps.toString() !== "0";
    if (type === "cooldown") return policy.cooldownSeconds.toString() !== "0";
    return false;
  };

  const modules = [
    {
      id: "pause",
      title: "Global Transfer Pause",
      desc: "Halt all token transfers temporarily. Useful for emergencies or planned maintenance periods.",
      type: "toggle",
      activeState: paused,
      onToggle: () => setPaused(!paused),
      onDeactivate: null,
      inputValue: null,
      onInputChange: null,
      configureLink: null
    },
    {
      id: "allowlist",
      title: "Allowlist Configuration",
      desc: "Restrict all token transfers strictly to verified addresses pre-approved by the admin authority.",
      type: "toggle",
      activeState: allowlistEnabled,
      onToggle: () => setAllowlistEnabled(!allowlistEnabled),
      onDeactivate: null,
      inputValue: null,
      onInputChange: null,
      configureLink: "/hooks/allowlist"
    },
    {
      id: "denylist",
      title: "Denylist Configuration",
      desc: "Block specific addresses or bad actors from transferring or receiving your token.",
      type: "toggle",
      activeState: denylistEnabled,
      onToggle: () => setDenylistEnabled(!denylistEnabled),
      onDeactivate: null,
      inputValue: null,
      onInputChange: null,
      configureLink: "/hooks/denylist"
    },
    {
      id: "vesting",
      title: "Vesting / Lockup",
      desc: "Enforce time-locked release schedules for specific token holders to prevent early dumping.",
      type: "toggle",
      activeState: vestingEnabled,
      onToggle: () => setVestingEnabled(!vestingEnabled),
      onDeactivate: null,
      inputValue: null,
      onInputChange: null,
      configureLink: "/hooks/vesting"
    },
    {
      id: "max_amount",
      title: "Maximum Transfer Amount",
      desc: "Cap the maximum amount of tokens that can be transferred in a single transaction.",
      type: "numeric",
      activeState: maxTransferAmount !== "0",
      onToggle: () => setMaxTransferAmount("1000"),
      onDeactivate: () => setMaxTransferAmount("0"),
      inputValue: maxTransferAmount,
      onInputChange: (val: string) => setMaxTransferAmount(val),
      configureLink: null,
      label: "Max Amount"
    },
    {
      id: "min_amount",
      title: "Minimum Transfer Amount",
      desc: "Set a strict floor on transfer sizes to prevent anti-dust attacks or spam transactions.",
      type: "numeric",
      activeState: minTransferAmount !== "0",
      onToggle: () => setMinTransferAmount("1"),
      onDeactivate: () => setMinTransferAmount("0"),
      inputValue: minTransferAmount,
      onInputChange: (val: string) => setMinTransferAmount(val),
      configureLink: null,
      label: "Min Amount"
    },
    {
      id: "max_bps",
      title: "Receiver Wallet Cap",
      desc: "Limit how much of the total token supply a single wallet can hold (in basis points).",
      type: "numeric",
      activeState: maxHolderBps !== "0",
      onToggle: () => setMaxHolderBps("100"),
      onDeactivate: () => setMaxHolderBps("0"),
      inputValue: maxHolderBps,
      onInputChange: (val: string) => setMaxHolderBps(val),
      configureLink: null,
      label: "Max Holder BPS (0-10000)"
    },
    {
      id: "cooldown",
      title: "Transfer Cooldown",
      desc: "Enforce a time delay (in seconds) between outgoing transfers from the same wallet.",
      type: "numeric",
      activeState: cooldownSeconds !== "0",
      onToggle: () => setCooldownSeconds("3600"),
      onDeactivate: () => setCooldownSeconds("0"),
      inputValue: cooldownSeconds,
      onInputChange: (val: string) => setCooldownSeconds(val),
      configureLink: null,
      label: "Cooldown Seconds"
    }
  ];

  const installedModules = modules.filter(m => isInstalled(m.id));
  const availableModules = modules.filter(m => !isInstalled(m.id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCard = (m: any) => (
    <article key={m.id} className="border-2 border-black p-5 bg-[#faf9f8] flex flex-col h-full hover:bg-white transition-colors duration-200 group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold uppercase">{m.title}</h3>
        <span className={`border-2 border-black px-2 py-1 text-[10px] font-bold uppercase ${
          m.activeState ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f3f4f6] text-[#4b5563]"
        }`}>
          {m.activeState ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>
      <p className="text-xs text-[#5C4E4E] mb-6 flex-grow">{m.desc}</p>
      
      {isPending(m.id) && (
        <p className="text-[10px] text-yellow-600 font-bold mb-2 uppercase">Pending Save</p>
      )}
      
      <div className="mt-auto flex flex-col gap-2">
        {m.type === "toggle" ? (
          <>
            <button 
              onClick={m.onToggle}
              className={`border-2 border-black w-full py-2 font-bold uppercase text-sm transition-colors cursor-pointer active:translate-y-[1px] ${
                m.activeState 
                  ? "bg-transparent text-black hover:bg-black hover:text-white" 
                  : "bg-[#5C4E4E] text-white hover:bg-black"
              }`}
            >
              {m.activeState ? "Deactivate" : "Activate"}
            </button>
            {m.activeState && !isPending(m.id) && m.configureLink && (
              <Link href={m.configureLink} className="block text-center border-2 border-black w-full py-2 bg-transparent text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors active:translate-y-[1px]">
                Configure
              </Link>
            )}
          </>
        ) : (
          <>
            {m.activeState ? (
              <>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase mb-1 text-[#5C4E4E]">{m.label}</label>
                  <Input 
                    type="number" 
                    min="0"
                    step="1"
                    max={m.id === "max_bps" ? "10000" : undefined}
                    value={m.inputValue} 
                    onChange={(e) => m.onInputChange(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={m.onDeactivate}
                  className="border-2 border-black w-full py-2 mt-2 bg-transparent text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors cursor-pointer active:translate-y-[1px]"
                >
                  Deactivate
                </button>
              </>
            ) : (
              <button 
                onClick={m.onToggle}
                className="border-2 border-black w-full py-2 bg-[#5C4E4E] text-white font-bold uppercase text-sm hover:bg-black transition-colors cursor-pointer active:translate-y-[1px]"
              >
                Activate
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-8 pt-20 max-w-5xl mx-auto w-full space-y-8 font-mono text-black">
        {/* Page Header & Target Mint Compact Bar */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-tighter mb-2">Hook Marketplace</h1>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest mb-6">
            Manage and install smart contract extensions for your token
          </p>
          <div className="border-2 border-black p-3 bg-[#faf9f8] flex flex-col md:flex-row items-center gap-4 w-full md:w-max">
            <span className="text-sm font-bold uppercase tracking-widest text-black">Target Mint:</span>
            <div className="w-80">
              <MintCombobox 
                placeholder="Enter SPL Token Mint Address..." 
                value={mintInput} 
                onChange={(val) => setMintInput(val)} 
              />
            </div>
            <Button onClick={handleSetMint} disabled={loading} variant="secondary">
              Load
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-8">
            <Toast
              type={statusMessage.type}
              message={statusMessage.text}
              onClose={() => setStatusMessage(null)}
            />
          </div>
        )}

        {activeMint && !isInitialized && (
          <div className="border-2 border-black bg-[#5C4E4E] text-white p-6 mb-12">
            <h3 className="text-xl font-bold uppercase mb-2">Not Initialized</h3>
            <p className="text-sm">This mint has no policy configured. Please initialize it on the Dashboard first.</p>
          </div>
        )}

        {activeMint && isInitialized && policy && (
          <>
            {/* Logic & UX Warning Banners */}
            {!dismissedWarnings["rpc_delay_info"] && (
              <div className="mb-6 p-4 border-2 border-black bg-[#4B5563] text-white font-bold uppercase tracking-widest text-sm flex justify-between items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>RPC Sync: After saving, it may take a few seconds for Devnet nodes to reflect your new module state.</span>
                </div>
                <button onClick={() => dismissWarning("rpc_delay_info")} className="shrink-0 hover:text-black transition-colors" aria-label="Dismiss">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            {paused && !dismissedWarnings["global_pause"] && (
              <div className="mb-6 p-4 border-2 border-black bg-red-700 text-white font-bold uppercase tracking-widest text-sm flex justify-between items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>Global Pause is active. All token transfers are halted regardless of other configurations.</span>
                </div>
                <button onClick={() => dismissWarning("global_pause")} className="shrink-0 hover:text-black transition-colors" aria-label="Dismiss">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            {allowlistEnabled && denylistEnabled && !dismissedWarnings["allowlist_denylist"] && (
              <div className="mb-6 p-4 border-2 border-black bg-yellow-400 text-black font-bold uppercase tracking-widest text-sm flex justify-between items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>Warning: Both Allowlist and Denylist are active. Users must be ON the Allowlist AND NOT ON the Denylist to transfer.</span>
                </div>
                <button onClick={() => dismissWarning("allowlist_denylist")} className="shrink-0 hover:text-white transition-colors" aria-label="Dismiss">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Save Action Banner */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold uppercase tracking-tighter border-b-2 border-black pb-2 inline-block">Installed Hooks</h2>
              <Button onClick={handleSavePolicy} disabled={loading || !hasUnsavedChanges}>
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>

            {/* Installed Hooks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {installedModules.length > 0 ? (
                installedModules.map(renderCard)
              ) : (
                <div className="col-span-full border-2 border-dashed border-black p-8 text-center text-[#5C4E4E]">
                  <p className="text-sm font-bold uppercase tracking-widest">No modules currently installed.</p>
                </div>
              )}
            </div>
            
            {/* Available Hooks Grid */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-tighter border-b-2 border-black pb-2 inline-block">Available Hooks</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {availableModules.length > 0 ? (
                availableModules.map(renderCard)
              ) : (
                <div className="col-span-full border-2 border-dashed border-black p-8 text-center text-[#5C4E4E]">
                  <p className="text-sm font-bold uppercase tracking-widest">All modules are installed!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Browse Marketplace Grid */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-black pb-2 mb-6 gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-tighter">Community Extensions</h2>
            <div className="relative w-full md:w-64">
              <Input 
                type="text" 
                placeholder="Search extensions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "KYC Gate", desc: "Requires sender/receiver to have valid civic pass or external KYC attestation.", author: "Compliance_DAO" },
              { name: "Taxation Hook", desc: "Automatically deducts a flat fee or percentage on every transfer to a treasury wallet.", author: "Treasury_Labs" },
              { name: "Royalty Enforcer", desc: "Enforces creator royalties on SPL22 tokens transferred via supported AMMs.", author: "Metaplex" },
              { name: "Time Lock", desc: "Prevents newly minted or vested tokens from being transferred until a specific epoch.", author: "Vesting_Protocol" }
            ].filter(ext => 
              ext.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              ext.desc.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((ext, idx) => (
              <article key={idx} className="border-2 border-black p-4 bg-white flex flex-col h-full relative">
                <h3 className="text-sm font-bold uppercase text-black mb-2">{ext.name}</h3>
                <p className="text-[11px] text-[#5C4E4E] mb-4 flex-grow">{ext.desc}</p>
                <div className="flex justify-end items-center mt-auto border-t-2 border-black pt-3">
                  <button disabled className="border-2 border-black px-3 py-1 bg-gray-200 text-gray-500 font-bold uppercase text-[10px] cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </article>
            ))}

            {searchQuery && (
              <div className="col-span-full text-center py-8">
                <p className="text-sm font-bold uppercase tracking-widest text-[#5C4E4E]">No more results found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
