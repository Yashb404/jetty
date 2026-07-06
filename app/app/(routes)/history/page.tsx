"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import Card from "../../../components/ui/card";
import { Copy, Check, Search, Filter } from "lucide-react";

interface HistoryLog {
  id: number;
  wallet_pubkey: string;
  action_type: string;
  target_mint: string;
  details: string | null;
  timestamp: string;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black" title="Copy to clipboard">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

export default function HistoryPage() {
  const { publicKey } = useWallet();
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset page when filters change
  useEffect(() => {
    setTimeout(() => setCurrentPage(1), 0);
  }, [searchQuery, actionFilter, timeFilter, pageSize]);

  useEffect(() => {
    if (publicKey) {
      setTimeout(() => setLoading(true), 0);
      fetch(`/api/history?wallet=${publicKey.toBase58()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.logs) {
            setLogs(data.logs);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTimeout(() => setLogs([]), 0);
    }
  }, [publicKey]);

  const uniqueActions = ["All", ...Array.from(new Set(logs.map(l => l.action_type)))];

  const filteredLogs = logs.filter(log => {
    // 1. Search Query
    const searchMatch = log.target_mint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!searchMatch) return false;

    // 2. Action Filter
    if (actionFilter !== "All" && log.action_type !== actionFilter) return false;

    // 3. Time Filter
    if (timeFilter !== "All Time") {
      const logDate = new Date(log.timestamp).getTime();
      const hoursDiff = (now - logDate) / (1000 * 60 * 60);

      if (timeFilter === "Last 24 Hours" && hoursDiff > 24) return false;
      if (timeFilter === "Last 7 Days" && hoursDiff > 24 * 7) return false;
      if (timeFilter === "Last 30 Days" && hoursDiff > 24 * 30) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-8 pt-20 max-w-5xl mx-auto w-full space-y-8 font-mono text-black">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Action History</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest mb-4">
            A complete log of your policy modifications and allowlist changes
          </p>
          <div className="bg-[#faf9f8] border-2 border-black p-3 text-xs font-bold uppercase tracking-widest text-black">
            Note: Due to free-tier database limitations, transaction history may occasionally be unavailable.
          </div>
        </div>

        {!publicKey ? (
          <Card variant="dark">
            <h3 className="text-xl font-bold uppercase mb-2">Wallet Disconnected</h3>
            <p className="text-sm">Please connect your wallet to view your action history.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C4E4E]" />
                <input
                  type="text"
                  placeholder="Search by Mint or Details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-[#988686] text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#5C4E4E]" />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="border-2 border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 appearance-none"
                  >
                    {uniqueActions.map(act => <option key={act} value={act}>{act}</option>)}
                  </select>
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="border-2 border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 appearance-none"
                >
                  <option value="All Time">All Time</option>
                  <option value="Last 24 Hours">Last 24 Hours</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border-2 border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 appearance-none"
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-2 border-black bg-[#5C4E4E] text-white font-bold uppercase tracking-widest text-sm">
                <div className="col-span-3">Action</div>
                <div className="col-span-4">Target Mint</div>
                <div className="col-span-3">Details</div>
                <div className="col-span-2 text-right">Time</div>
              </div>

              <div className="divide-y-2 divide-black">
                {loading ? (
                  <div className="px-6 py-8 text-center text-[#5C4E4E] font-semibold uppercase tracking-widest">
                    Loading history...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="px-6 py-8 text-center text-[#5C4E4E] font-semibold uppercase tracking-widest">
                    No actions match your filters.
                  </div>
                ) : (
                  paginatedLogs.map((log) => (
                    <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#faf9f8]">
                      <div className="col-span-3 font-bold uppercase text-xs">
                        {log.action_type}
                      </div>
                      <div className="col-span-4 text-xs flex items-center gap-2">
                        <span>{log.target_mint.slice(0, 8)}...{log.target_mint.slice(-8)}</span>
                        <CopyButton text={log.target_mint} />
                      </div>
                      <div className="col-span-3 text-xs text-[#5C4E4E] overflow-hidden">
                        {(() => {
                          if (!log.details) return "-";
                          try {
                            const parsed = JSON.parse(log.details);
                            const { tx, ...rest } = parsed;
                            
                            const KEY_TO_NAME: Record<string, string> = {
                              paused: "Global Pause",
                              allowlistEnabled: "Allowlist",
                              maxTransferAmount: "Max Amount",
                              vestingEnabled: "Vesting",
                              minTransferAmount: "Min Amount",
                              maxHolderBps: "Receiver Cap",
                              denylistEnabled: "Denylist",
                              cooldownSeconds: "Cooldown"
                            };

                            const restStr = Object.entries(rest)
                              .filter((entry) => entry[1] !== null)
                              .map(([k, v]) => {
                                const name = KEY_TO_NAME[k] || k;
                                return `${name}: ${v}`;
                              })
                              .join(' | ');

                            return (
                              <div className="space-y-1">
                                {tx && (
                                  <div className="flex items-center gap-2 text-black font-bold">
                                    <span>Tx: {tx.slice(0, 4)}...{tx.slice(-4)}</span>
                                    <CopyButton text={tx} />
                                  </div>
                                )}
                                {restStr && (
                                  <div className="truncate" title={restStr}>
                                    {restStr}
                                  </div>
                                )}
                              </div>
                            );
                          } catch {
                            return (
                              <div className="truncate" title={log.details}>
                                {log.details}
                              </div>
                            );
                          }
                        })()}
                      </div>
                      <div className="col-span-2 text-xs text-right text-[#5C4E4E]">
                        {new Date(log.timestamp + (!log.timestamp.includes('Z') ? 'Z' : '')).toLocaleString(undefined, { timeZoneName: 'short' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-bold uppercase tracking-widest text-[#5C4E4E]">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-2 border-black px-4 py-2 bg-white text-sm font-bold uppercase hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-2 border-black px-4 py-2 bg-white text-sm font-bold uppercase hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
