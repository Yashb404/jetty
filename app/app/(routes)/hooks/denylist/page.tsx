"use client";

import React, { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import Card from "../../../../components/ui/card";
import Input from "../../../../components/ui/input";
import Button from "../../../../components/ui/button";
import MintCombobox from "../../../../components/ui/mint-combobox";
import { useMintPolicy } from "../../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../../lib/hooks/useJettyProgram";
import { useDenylist } from "../../../../lib/hooks/useDenylist";
import { useMintContext } from "../../../../contexts/MintProvider";
import { useRecentMints } from "../../../../lib/hooks/useRecentMints";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function DenylistManagerPage() {
  const { activeMint, setActiveMint } = useMintContext();
  const [mintInput, setMintInput] = useState(activeMint || "");
  const { addMint } = useRecentMints();

  useEffect(() => {
    if (activeMint) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMintInput(activeMint);
    }
  }, [activeMint]);

  const { isInitialized, policy } = useMintPolicy(activeMint);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && policy && !policy.denylistEnabled) {
      toast.error("Denylist is not enabled for this mint.");
      router.push("/library");
    }
  }, [isInitialized, policy, router]);
  const { entries, refetch: refetchDenylist } = useDenylist(activeMint);
  const { updateDenylist, loading } = useJettyProgram();

  const [newTokenAccountInput, setNewTokenAccountInput] = useState("");

  const handleSetMint = () => {
    try {
      new PublicKey(mintInput);
      setActiveMint(mintInput);
      addMint(mintInput);
    } catch {
      alert("Invalid PublicKey");
    }
  };

  const handleBlockTokenAccount = async () => {
    if (!activeMint || !newTokenAccountInput) return;
    try {
      await updateDenylist(new PublicKey(activeMint), new PublicKey(newTokenAccountInput), true);
      setNewTokenAccountInput("");
      refetchDenylist();
    } catch (e) {
      console.error(e);
      alert("Failed to block token account.");
    }
  };

  const handleUnblockTokenAccount = async (tokenAccount: PublicKey) => {
    if (!activeMint) return;
    try {
      await updateDenylist(new PublicKey(activeMint), tokenAccount, false);
      refetchDenylist();
    } catch (e) {
      console.error(e);
      alert("Failed to unblock token account.");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Denylist Manager</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Block specific token accounts from sending or receiving your token
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
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">Block Token Account</label>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Note: Add the Associated Token Account (ATA), not the Wallet Address.</p>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Token Account Address..."
                  value={newTokenAccountInput}
                  onChange={(e) => setNewTokenAccountInput(e.target.value)}
                />
                <Button onClick={handleBlockTokenAccount} disabled={loading} className="bg-red-700 hover:bg-red-900 text-white">
                  {loading ? "Blocking..." : "Add to Denylist"}
                </Button>
              </div>
            </Card>

            <Card className="p-0">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-2 border-black bg-[#FF5722] text-white font-bold uppercase tracking-widest text-sm">
                <div className="col-span-8">Token Account</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="divide-y-2 divide-black">
                {entries.length === 0 ? (
                  <div className="px-6 py-8 text-center text-[#5C4E4E] font-semibold uppercase tracking-widest">
                    No token accounts denylisted yet.
                  </div>
                ) : (
                  entries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#f4f3f2]">
                      <div className="col-span-8 flex items-center gap-3">
                        <span className={`font-mono ${!entry.account.blocked ? 'text-[#988686] line-through' : 'text-black'}`}>
                          {entry.account.tokenAccount.toBase58()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {entry.account.blocked ? (
                          <span className="px-2 py-1 bg-red-700 text-white text-xs font-bold uppercase">Blocked</span>
                        ) : (
                          <span className="px-2 py-1 border-2 border-black text-black text-xs font-bold uppercase">Unblocked</span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-end">
                        {entry.account.blocked ? (
                          <Button variant="secondary" onClick={() => handleUnblockTokenAccount(entry.account.tokenAccount)} disabled={loading} className="!py-1 !px-3 !text-xs">
                            Unblock
                          </Button>
                        ) : (
                          <Button variant="secondary" onClick={() => handleUnblockTokenAccount(entry.account.tokenAccount)} disabled={loading} className="!py-1 !px-3 !text-xs">
                            Block
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
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
