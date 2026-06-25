"use client";

import React, { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import WalletConnect from "../../../components/web3/wallet-connect";
import Card from "../../../components/ui/card";
import Input from "../../../components/ui/input";
import Button from "../../../components/ui/button";
import MintCombobox from "../../../components/ui/mint-combobox";
import { useMintPolicy } from "../../../lib/hooks/useMintPolicy";
import { useJettyProgram } from "../../../lib/hooks/useJettyProgram";
import { useAllowlist } from "../../../lib/hooks/useAllowlist";
import { useMintContext } from "../../../contexts/MintProvider";
import { useRecentMints } from "../../../lib/hooks/useRecentMints";

export default function AllowlistManagerPage() {
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
  const { entries, refetch: refetchAllowlist } = useAllowlist(activeMint);
  const { updateAllowlist, loading } = useJettyProgram();

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

  const handleAddTokenAccount = async () => {
    if (!activeMint || !newTokenAccountInput) return;
    try {
      await updateAllowlist(new PublicKey(activeMint), new PublicKey(newTokenAccountInput), true);
      setNewTokenAccountInput("");
      refetchAllowlist();
    } catch (e) {
      console.error(e);
      alert("Failed to add token account.");
    }
  };

  const handleRevokeTokenAccount = async (tokenAccount: PublicKey) => {
    if (!activeMint) return;
    try {
      await updateAllowlist(new PublicKey(activeMint), tokenAccount, false);
      refetchAllowlist();
    } catch (e) {
      console.error(e);
      alert("Failed to revoke token account.");
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

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Allowlist Manager</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Manage authorized token accounts for your mint
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
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">Add Token Account</label>
              <p className="text-[#5C4E4E] text-xs uppercase tracking-wider mb-4">Note: Add the Associated Token Account (ATA), not the Wallet Address.</p>
              <div className="flex gap-4">
                <Input 
                  placeholder="Enter Token Account Address..." 
                  value={newTokenAccountInput} 
                  onChange={(e) => setNewTokenAccountInput(e.target.value)} 
                />
                <Button onClick={handleAddTokenAccount} disabled={loading}>
                  {loading ? "Adding..." : "Add to Allowlist"}
                </Button>
              </div>
            </Card>

            <Card className="p-0">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-2 border-black bg-[#5C4E4E] text-white font-bold uppercase tracking-widest text-sm">
                <div className="col-span-8">Token Account</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              
              <div className="divide-y-2 divide-black">
                {entries.length === 0 ? (
                  <div className="px-6 py-8 text-center text-[#5C4E4E] font-semibold uppercase tracking-widest">
                    No token accounts allowlisted yet.
                  </div>
                ) : (
                  entries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#D1D1D0]">
                      <div className="col-span-8 flex items-center gap-3">
                        <span className={`font-mono ${!entry.account.active ? 'text-[#988686] line-through' : 'text-black'}`}>
                          {entry.account.tokenAccount.toBase58()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {entry.account.active ? (
                          <span className="px-2 py-1 bg-black text-white text-xs font-bold uppercase">Active</span>
                        ) : (
                          <span className="px-2 py-1 border-2 border-black text-black text-xs font-bold uppercase">Inactive</span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-end">
                        {entry.account.active ? (
                          <Button variant="secondary" onClick={() => handleRevokeTokenAccount(entry.account.tokenAccount)} disabled={loading} className="!py-1 !px-3 !text-xs">
                            Revoke
                          </Button>
                        ) : (
                          <Button variant="secondary" onClick={() => handleRevokeTokenAccount(entry.account.tokenAccount)} disabled={loading} className="!py-1 !px-3 !text-xs">
                            Restore
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
          <Card className="bg-[#5C4E4E] text-white">
            <h3 className="text-xl font-bold uppercase mb-2">Not Initialized</h3>
            <p className="text-sm">This mint has no policy configured. Please initialize it on the Dashboard first.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
