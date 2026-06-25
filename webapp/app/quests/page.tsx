"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { QUEST_MANAGER_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

const QUEST_IDS = [1, 2, 3, 4, 5];

const QUEST_META: Record<number, { title: string; description: string; icon: string }> = {
  1: { title: "Introduction to Blockchain", description: "Learn the fundamentals of distributed ledger technology", icon: "⛓️" },
  2: { title: "Understanding Smart Contracts", description: "Master the basics of self-executing contracts", icon: "📜" },
  3: { title: "DeFi Fundamentals", description: "Explore decentralized finance protocols", icon: "💰" },
  4: { title: "Real Estate Tokenization", description: "Learn how real-world assets become on-chain tokens", icon: "🏠" },
  5: { title: "Security Best Practices", description: "Protect yourself and your assets in Web3", icon: "🛡️" },
};

export default function QuestsPage() {
  const { isConnected, address, chain } = useAccount();
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addrs = getAddressesForChain(chain?.id);

  const { data: quest1 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "getQuest", args: [1n], query: { enabled: !!addrs?.questManager } });
  const { data: quest2 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "getQuest", args: [2n], query: { enabled: !!addrs?.questManager } });
  const { data: quest3 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "getQuest", args: [3n], query: { enabled: !!addrs?.questManager } });
  const { data: quest4 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "getQuest", args: [4n], query: { enabled: !!addrs?.questManager } });
  const { data: quest5 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "getQuest", args: [5n], query: { enabled: !!addrs?.questManager } });

  const questData = [quest1, quest2, quest3, quest4, quest5];

  const { data: comp1 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "completed", args: address ? [address, 1n] : undefined, query: { enabled: !!address && !!addrs?.questManager } });
  const { data: comp2 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "completed", args: address ? [address, 2n] : undefined, query: { enabled: !!address && !!addrs?.questManager } });
  const { data: comp3 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "completed", args: address ? [address, 3n] : undefined, query: { enabled: !!address && !!addrs?.questManager } });
  const { data: comp4 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "completed", args: address ? [address, 4n] : undefined, query: { enabled: !!address && !!addrs?.questManager } });
  const { data: comp5 } = useReadContract({ address: addrs?.questManager, abi: QUEST_MANAGER_ABI, functionName: "completed", args: address ? [address, 5n] : undefined, query: { enabled: !!address && !!addrs?.questManager } });

  const completedData = [comp1, comp2, comp3, comp4, comp5];

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleCompleteQuest = async (questId: number) => {
    if (!address || !addrs?.questManager) return;
    setError(null);
    setCompletingId(questId);

    try {
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const res = await fetch("/api/quest/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: address, questId, deadline }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get quest signature");
        setCompletingId(null);
        return;
      }

      writeContract({
        address: addrs.questManager,
        abi: QUEST_MANAGER_ABI,
        functionName: "completeQuest",
        args: [BigInt(questId), data.signature as `0x${string}`, address, BigInt(deadline)],
      });

      setCompletingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to complete quest");
      setCompletingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to view quests.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Quests</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Complete quests to earn XP and NFT rewards. Quests are verified by signed proofs from the game server.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-800/50 bg-red-900/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-xs text-zinc-500 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {QUEST_IDS.map((id, i) => {
          const q = questData[i];
          const isCompleted = completedData[i] ?? false;
          const meta = QUEST_META[id];
          const exists = q?.[2] ?? false;
          const xpReward = q?.[0] ?? 0n;
          const hasNft = q?.[1] ? (q[1] as string).length > 0 : false;

          if (!exists) {
            return (
              <div key={id} className="flex items-center justify-between rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 opacity-40">
                <div>
                  <h3 className="font-semibold text-zinc-500">{meta.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">Coming soon</p>
                </div>
                <span className="rounded-full bg-zinc-800 px-4 py-1.5 text-xs text-zinc-500">Locked</span>
              </div>
            );
          }

          return (
            <div
              key={id}
              className={`flex items-center justify-between rounded-2xl border p-6 transition-colors ${
                isCompleted
                  ? "border-emerald-800/50 bg-emerald-900/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{meta.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{meta.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-medium text-emerald-400">+{formatEther(xpReward)} XP</span>
                    {hasNft && <span className="text-xs text-amber-400">NFT Reward</span>}
                  </div>
                </div>
              </div>
              <div>
                {isCompleted ? (
                  <span className="rounded-full bg-emerald-900/50 px-4 py-1.5 text-xs font-medium text-emerald-400">
                    Completed
                  </span>
                ) : (
                  <button
                    disabled={completingId === id || isPending || isConfirming}
                    className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                    onClick={() => handleCompleteQuest(id)}
                  >
                    {completingId === id
                      ? "Signing..."
                      : isPending
                      ? "Confirming..."
                      : isConfirming
                      ? "Processing..."
                      : "Complete"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
