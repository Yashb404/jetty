"use client";

import React, { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import Card from "../../../../components/ui/card";
import Input from "../../../../components/ui/input";
import Button from "../../../../components/ui/button";
import MintCombobox from "../../../../components/ui/mint-combobox";
import { useMintPolicy } from "../../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../../lib/hooks/useJettyProgram";
import { useVesting } from "../../../../lib/hooks/useVesting";
import { useMintContext } from "../../../../contexts/MintProvider";
import { useRecentMints } from "../../../../lib/hooks/useRecentMints";
import Link from "next/link";

export default function VestingManagerPage() {
  const { activeMint, setActiveMint } = useMintContext();
  const [mintInput, setMintInput] = useState(activeMint || "");
  const { addMint } = useRecentMints();

  useEffect(() => {
    if (activeMint) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMintInput(activeMint);
    }
  }, [activeMint]);

  const { isInitialized } = useMintPolicy(activeMint);
  const { entries, refetch: refetchVesting } = useVesting(activeMint);
  const { setVestingLock, clearVestingLock, loading } = useJettyProgram();

  const [newTokenAccountInput, setNewTokenAccountInput] = useState("");
  const [releaseDatetime, setReleaseDatetime] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSetMint = () => {
    try {
      new PublicKey(mintInput);
      setActiveMint(mintInput);
      addMint(mintInput);
    } catch {
      alert("Invalid PublicKey");
    }
  };

  const handleSetLock = async () => {
    if (!activeMint || !newTokenAccountInput || !releaseDatetime) return;
    try {
      // Convert datetime-local value to unix timestamp in seconds
      const date = new Date(releaseDatetime);
      const unixSeconds = Math.floor(date.getTime() / 1000);
      const timestampBN = new BN(unixSeconds);

      await setVestingLock(new PublicKey(activeMint), new PublicKey(newTokenAccountInput), timestampBN);
      setNewTokenAccountInput("");
      setReleaseDatetime("");
      refetchVesting();
    } catch (e) {
      console.error(e);
      alert("Failed to set vesting lock.");
    }
  };

  const handleClearLock = async (tokenAccount: PublicKey) => {
    if (!activeMint) return;
    try {
      await clearVestingLock(new PublicKey(activeMint), tokenAccount);
      refetchVesting();
    } catch (e) {
      console.error(e);
      alert("Failed to clear vesting lock.");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Vesting & Lockup Manager</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Enforce time-locked release schedules for token holders
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

        {activeMint && isInitialized && (
          <div className="space-y-6">
            <Card>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">Lock Token Account</label>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Note: Add the Associated Token Account (ATA), not the Wallet Address.</p>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-[10px] font-bold uppercase mb-1 text-[#5C4E4E]">Token Account Address</label>
                  <Input
                    placeholder="Enter Token Account Address..."
                    value={newTokenAccountInput}
                    onChange={(e) => setNewTokenAccountInput(e.target.value)}
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[10px] font-bold uppercase mb-1 text-[#5C4E4E]">Release Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={releaseDatetime}
                    onChange={(e) => setReleaseDatetime(e.target.value)}
                  />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <Button onClick={handleSetLock} disabled={loading || !newTokenAccountInput || !releaseDatetime} className="w-full">
                    {loading ? "Locking..." : "Set Lock"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-0">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-2 border-black bg-[#FF5722] text-white font-bold uppercase tracking-widest text-sm">
                <div className="col-span-6">Token Account</div>
                <div className="col-span-4">Release Date</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="divide-y-2 divide-black">
                {entries.length === 0 ? (
                  <div className="px-6 py-8 text-center text-[#5C4E4E] font-semibold uppercase tracking-widest">
                    No token accounts are currently locked.
                  </div>
                ) : (
                  entries.map((entry, idx) => {
                    const releaseDate = new Date(entry.account.releaseTimestamp.toNumber() * 1000);
                    const isLocked = releaseDate.getTime() > now;

                    return (
                      <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#f4f3f2]">
                        <div className="col-span-6 flex items-center gap-3">
                          <span className="font-mono text-black">
                            {entry.account.tokenAccount.toBase58()}
                          </span>
                        </div>
                        <div className="col-span-4">
                          <span className={`px-2 py-1 text-xs font-bold uppercase ${isLocked ? "bg-black text-white" : "border-2 border-black text-black"}`}>
                            {releaseDate.toLocaleString()}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button variant="secondary" onClick={() => handleClearLock(entry.account.tokenAccount)} disabled={loading} className="!py-1 !px-3 !text-xs">
                            Clear Lock
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}

        {activeMint && !isInitialized && (
          <Card variant="dark">
            <h3 className="text-xl font-bold uppercase mb-2">Not Initialized</h3>
            <p className="text-sm">This mint has no policy configured. Please initialize it on the Dashboard first.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
