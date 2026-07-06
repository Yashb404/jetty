"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Card from "../../../components/ui/card";
import Input from "../../../components/ui/input";
import Button from "../../../components/ui/button";
import Tooltip from "../../../components/ui/tooltip";
import { useMintPolicy } from "../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../lib/hooks/useJettyProgram";
import { PublicKey } from "@solana/web3.js";
import { useMintContext } from "../../../contexts/MintProvider";
import toast from "react-hot-toast";
import { Pause, ShieldCheck, Ban, Clock, ArrowDownToLine, ArrowUpToLine, PieChart, Hourglass } from "lucide-react";

export default function Home() {
  const { activeMint, setActiveMint } = useMintContext();
  const [mintInput, setMintInput] = useState(activeMint || "");

  useEffect(() => {
    if (activeMint) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMintInput(activeMint);
    }
  }, [activeMint]);

  const { policy, isInitialized, metaListExists, refetch } = useMintPolicy(activeMint);
  const { initializeHookConfig, initExtraAccountMetaList, assignPolicyAuthority, createToken2022Mint, loading } = useJettyProgram();

  const [newAuthInput, setNewAuthInput] = useState("");

  const handleSetMint = () => {
    try {
      new PublicKey(mintInput);
      setActiveMint(mintInput);
    } catch {
      toast.error("Invalid PublicKey");
    }
  };

  const handleInit = async () => {
    if (!activeMint) return;
    try {
      await initializeHookConfig(new PublicKey(activeMint));
      toast.success("Hook Config Initialized!");
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const handleInitMeta = async () => {
    if (!activeMint) return;
    try {
      await initExtraAccountMetaList(new PublicKey(activeMint));
      toast.success("Extra Account Meta List Initialized!");
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const handleRotateAuthority = async () => {
    if (!activeMint || !newAuthInput) return;
    try {
      await assignPolicyAuthority(new PublicKey(activeMint), new PublicKey(newAuthInput));
      toast.success("Authority Rotated!");
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const handleCreateMint = async () => {
    try {
      const newMintStr = await createToken2022Mint();
      if (newMintStr) {
        setMintInput(newMintStr);
        setActiveMint(newMintStr);
        toast.success("Token-2022 Mint Created & Initialized!");
      }
    } catch {
      // Error handled by hook
    }
  };

  const activeRules = [];
  if (policy) {
    if (policy.paused) activeRules.push({ name: "Global Pause", value: "Active", icon: Pause, link: "/docs/global-pause" });
    if (policy.allowlistEnabled) activeRules.push({ name: "Allowlist", value: "Active", icon: ShieldCheck, link: "/hooks/allowlist" });
    if (policy.denylistEnabled) activeRules.push({ name: "Denylist", value: "Active", icon: Ban, link: "/hooks/denylist" });
    if (policy.vestingEnabled) activeRules.push({ name: "Vesting", value: "Active", icon: Clock, link: "/hooks/vesting" });
    if (policy.maxTransferAmount.toString() !== "0") activeRules.push({ name: "Max Transfer", value: policy.maxTransferAmount.toString(), icon: ArrowUpToLine, link: "/docs/volume-limits" });
    if (policy.minTransferAmount.toString() !== "0") activeRules.push({ name: "Min Transfer", value: policy.minTransferAmount.toString(), icon: ArrowDownToLine, link: "/docs/min-transfer" });
    if (policy.maxHolderBps > 0) activeRules.push({ name: "Receiver Cap", value: `${(policy.maxHolderBps / 100).toFixed(2)}%`, icon: PieChart, link: "/docs/receiver-cap" });
    if (policy.cooldownSeconds > 0) activeRules.push({ name: "Cooldown", value: `${policy.cooldownSeconds}s`, icon: Hourglass, link: "/docs/cooldown" });
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Dashboard Overview</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
              Manage your Transfer Hook Compliance Controller
            </p>
            <Tooltip text="Click here to learn how to initialize and configure your first Transfer Hook">
              <Link href="/docs/quick-guide" className="text-xs font-bold border-2 border-black px-4 py-2 hover:bg-black hover:text-[#f4f3f2] transition-colors uppercase tracking-widest inline-flex items-center gap-2 brutalist-button-active bg-white w-full sm:w-auto justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick Start Guide →
              </Link>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">Select Target Mint</label>
            <div className="flex gap-4">
              <Input
                placeholder="Enter SPL Token Mint Address..."
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
              />
              <Button onClick={handleSetMint} disabled={loading}>Load</Button>
            </div>
          </Card>

          <Card className="flex flex-col justify-center">
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">Create New Mint</label>
            <p className="text-xs text-[#5C4E4E] uppercase tracking-widest mb-4">
              Generate a Token-2022 Mint initialized with the Jetty Transfer Hook.
            </p>
            <Button
              onClick={handleCreateMint}
              disabled={loading}
              variant="secondary"
            >
              Create Token-2022 Mint
            </Button>
          </Card>
        </div>

        {activeMint && (
          <div className="space-y-6">
            {!isInitialized && (
              <Card variant="dark">
                <h3 className="text-xl font-bold uppercase mb-2">Initialize Policy</h3>
                <p className="mb-4 text-sm">This mint has not been initialized with Jetty yet.</p>
                <Button variant="secondary" onClick={handleInit} disabled={loading}>
                  {loading ? "Loading..." : "Initialize Hook Config"}
                </Button>
              </Card>
            )}

            {isInitialized && !metaListExists && (
              <Card variant="dark">
                <h3 className="text-xl font-bold uppercase mb-2">Initialize Account Meta List</h3>
                <p className="mb-4 text-sm">Required for Token-2022 Transfer Hook CPI resolution.</p>
                <Button variant="secondary" onClick={handleInitMeta} disabled={loading}>
                  {loading ? "Loading..." : "Create Meta List"}
                </Button>
              </Card>
            )}

            {isInitialized && (
              <>
                <div className="w-full overflow-hidden">
                  <div className="border-b-4 border-black pb-4 mb-6 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                      
                      <h3 className="text-2xl font-bold uppercase tracking-tighter leading-none">Active Hooks</h3>
                    </div>
                    <div className="bg-black text-white px-3 py-1 text-sm font-bold font-mono uppercase tracking-widest leading-none">
                      {activeRules.length} Running
                    </div>
                  </div>

                  {activeRules.length > 0 ? (
                    <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
                      {activeRules.map((rule, i) => {
                        const Icon = rule.icon;
                        return (
                          <div key={i} className="min-w-[280px] w-[280px] snap-start flex-none">
                            <Card className="flex flex-col h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-5 h-5 text-[#5C4E4E]" />
                                <div className="text-[#5C4E4E] font-bold uppercase tracking-widest text-xs">{rule.name}</div>
                              </div>
                              <div className="text-2xl font-bold uppercase truncate flex-1 mb-4">
                                {rule.value}
                              </div>
                              <Link href={rule.link} className="text-xs font-bold uppercase tracking-widest text-black border-b-2 border-transparent hover:border-black transition-colors self-start pb-0.5 inline-flex items-center gap-1">
                                Manage <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              </Link>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="bg-[#D1D1D0] text-center py-12 flex flex-col items-center justify-center border-dashed border-4 border-[#988686]">
                      <ShieldCheck className="w-12 h-12 text-[#988686] mb-4" />
                      <h3 className="text-xl font-bold uppercase mb-2">No Active Rules</h3>
                      <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest max-w-md mb-6">
                        Your token currently operates without any Transfer Hook restrictions. It behaves like a standard SPL Token.
                      </p>
                      <Link href="/library">
                        <Button variant="secondary">Configure Modules →</Button>
                      </Link>
                    </Card>
                  )}
                </div>

                <Card>
                  <h3 className="text-lg font-bold uppercase mb-4">Rotate Policy Authority</h3>
                  <div className="flex gap-4 mb-2">
                    <Input
                      placeholder="New Authority Address..."
                      value={newAuthInput}
                      onChange={(e) => setNewAuthInput(e.target.value)}
                    />
                    <Button onClick={handleRotateAuthority} disabled={loading} variant="secondary">Rotate</Button>
                  </div>
                  <p className="mt-2 text-xs text-[#5C4E4E] uppercase tracking-widest">
                    Current: {policy?.policyAuthority.toBase58()}
                  </p>
                  <div className="mt-4 p-3 border border-yellow-400 bg-yellow-50 rounded-sm">
                    <p className="text-[10px] text-yellow-800 uppercase tracking-wider font-bold mb-1">
                      Action Requires Multi-Sig
                    </p>
                    <p className="text-xs text-yellow-700">
                      Smart contract strictly enforces the &quot;Handshake Rule&quot; requiring both current and new authority to sign. Full support for partially signed transactions via this frontend will be added in a future update.
                    </p>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
