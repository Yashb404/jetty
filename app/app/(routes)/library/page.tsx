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
import Link from "next/link";
import toast from "react-hot-toast";


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
  const [searchQuery, setSearchQuery] = useState("");

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
      toast.error("Invalid PublicKey");
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
        toast.error("No changes detected.");
        return;
      }

      await updatePolicy(new PublicKey(activeMint), pausedArg, allowlistArg, parsedAmount);
      toast.success("Policy updated successfully!");
      refetch();
    } catch (e) {
      // Error already handled by useJettyProgram's toast
    }
  };

  const isPending = (type: "pause" | "allowlist" | "limit") => {
    if (!policy) return false;
    if (type === "pause") return paused !== policy.paused;
    if (type === "allowlist") return allowlistEnabled !== policy.allowlistEnabled;
    if (type === "limit") return maxTransferAmount !== policy.maxTransferAmount.toString();
    return false;
  };

  const hasUnsavedChanges = isPending("pause") || isPending("allowlist") || isPending("limit");

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

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full font-mono text-black">
        {/* Page Header & Target Mint Compact Bar */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-tighter mb-2">Hook Marketplace</h1>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest mb-6">
            Manage and install smart contract extensions for your token
          </p>
          <div className="border-2 border-black p-3 bg-[#D1D1D0] flex flex-col md:flex-row items-center gap-4 w-full md:w-max">
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

        {activeMint && !isInitialized && (
          <div className="border-2 border-black bg-[#5C4E4E] text-white p-6 mb-12">
            <h3 className="text-xl font-bold uppercase mb-2">Not Initialized</h3>
            <p className="text-sm">This mint has no policy configured. Please initialize it on the Dashboard first.</p>
          </div>
        )}

        {activeMint && isInitialized && policy && (
          <>
            {/* Save Action Banner */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold uppercase tracking-tighter border-b-2 border-black pb-2 inline-block">Installed Hooks</h2>
              <Button onClick={handleSavePolicy} disabled={loading || !hasUnsavedChanges}>
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>

            {/* Installed Hooks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Global Pause Card */}
              <article className="border-2 border-black p-5 bg-[#D1D1D0] flex flex-col h-full hover:bg-white transition-colors duration-200 group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold uppercase">Global Pause</h3>
                  <span className={`border-2 border-black px-2 py-1 text-[10px] font-bold uppercase ${
                    paused ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f3f4f6] text-[#4b5563]"
                  }`}>
                    {paused ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-[#5C4E4E] mb-6 flex-grow">
                  Halt all token transfers temporarily. Useful for emergencies or planned maintenance periods.
                </p>
                {isPending("pause") && (
                  <p className="text-[10px] text-yellow-600 font-bold mb-2 uppercase">Pending Save</p>
                )}
                <div className="mt-auto">
                  <button 
                    onClick={() => setPaused(!paused)}
                    className="border-2 border-black w-full py-2 bg-transparent text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                  >
                    {paused ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </article>

              {/* Allowlist Gate Card */}
              <article className="border-2 border-black p-5 bg-[#D1D1D0] flex flex-col h-full hover:bg-white transition-colors duration-200 group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold uppercase">Allowlist Gate</h3>
                  <span className={`border-2 border-black px-2 py-1 text-[10px] font-bold uppercase ${
                    allowlistEnabled ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f3f4f6] text-[#4b5563]"
                  }`}>
                    {allowlistEnabled ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-[#5C4E4E] mb-6 flex-grow">
                  Restrict all token transfers strictly to verified addresses pre-approved by the admin authority.
                </p>
                {isPending("allowlist") && (
                  <p className="text-[10px] text-yellow-600 font-bold mb-2 uppercase">Pending Save</p>
                )}
                <div className="mt-auto flex flex-col gap-2">
                  <button 
                    onClick={() => setAllowlistEnabled(!allowlistEnabled)}
                    className="border-2 border-black w-full py-2 bg-transparent text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                  >
                    {allowlistEnabled ? "Deactivate" : "Activate"}
                  </button>
                  {allowlistEnabled && !isPending("allowlist") && (
                    <Link href="/allowlist" className="block text-center border-2 border-black w-full py-2 bg-[#5C4E4E] text-white font-bold uppercase text-sm hover:bg-black transition-colors">
                      Configure
                    </Link>
                  )}
                </div>
              </article>

              {/* Token Limit Card */}
              <article className="border-2 border-black p-5 bg-[#D1D1D0] flex flex-col h-full hover:bg-white transition-colors duration-200 group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold uppercase">Token Limit</h3>
                  <span className={`border-2 border-black px-2 py-1 text-[10px] font-bold uppercase ${
                    maxTransferAmount !== "0" ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f3f4f6] text-[#4b5563]"
                  }`}>
                    {maxTransferAmount !== "0" ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-[#5C4E4E] mb-6 flex-grow">
                  Cap the maximum transfer amount per transaction to prevent mass dumping.
                </p>
                {isPending("limit") && (
                  <p className="text-[10px] text-yellow-600 font-bold mb-2 uppercase">Pending Save</p>
                )}
                <div className="mt-auto flex flex-col gap-2">
                  {maxTransferAmount !== "0" || isPending("limit") ? (
                    <>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase mb-1 text-[#5C4E4E]">Max Amount</label>
                        <Input 
                          type="number" 
                          value={maxTransferAmount} 
                          onChange={(e) => setMaxTransferAmount(e.target.value)} 
                        />
                      </div>
                      <button 
                        onClick={() => setMaxTransferAmount("0")}
                        className="border-2 border-black w-full py-2 mt-2 bg-transparent text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                      >
                        Deactivate
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setMaxTransferAmount("1000")} // default value to start configuration
                      className="border-2 border-black w-full py-2 bg-transparent text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </article>
            </div>
          </>
        )}

        {/* Browse Marketplace Grid */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-black pb-2 mb-6 gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-tighter">Browse Marketplace</h2>
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
                <div className="flex justify-between items-center mt-auto border-t-2 border-black pt-3">
                  <span className="text-[10px] font-bold uppercase text-[#5C4E4E]">By: {ext.author}</span>
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
