"use client";

import { useAccount } from "wagmi";

const quests = [
  { id: 1, title: "Introduction to Blockchain", xpReward: 100, nftReward: false },
  { id: 2, title: "Understanding Smart Contracts", xpReward: 150, nftReward: true },
  { id: 3, title: "DeFi Fundamentals", xpReward: 200, nftReward: true },
  { id: 4, title: "Real Estate Tokenization", xpReward: 250, nftReward: false },
  { id: 5, title: "Security Best Practices", xpReward: 300, nftReward: true },
];

export default function QuestsPage() {
  const { isConnected } = useAccount();

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
          Complete quests to earn XP and NFT rewards.
        </p>
      </div>

      <div className="grid gap-4">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700"
          >
            <div>
              <h3 className="font-semibold text-white">{quest.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                +{quest.xpReward} XP
                {quest.nftReward && " · NFT Reward"}
              </p>
            </div>
            <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
