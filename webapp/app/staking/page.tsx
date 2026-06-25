"use client";

import { useAccount } from "wagmi";

export default function StakingPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to view staking.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Staking</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stake tokens to earn XP over time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Your Stake</h2>
          <p className="mt-4 text-3xl font-bold text-emerald-400">0 GTK</p>
          <p className="mt-2 text-sm text-zinc-500">Currently staked</p>

          <div className="mt-6 flex gap-3">
            <input
              type="number"
              placeholder="Amount"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
            />
            <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
              Stake
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Rewards</h2>
          <p className="mt-4 text-3xl font-bold text-white">0 XP</p>
          <p className="mt-2 text-sm text-zinc-500">Earned from staking</p>

          <button className="mt-6 w-full rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white">
            Claim Rewards
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Staking Info</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-500">Reward Rate</p>
            <p className="mt-1 text-lg font-semibold text-white">10 XP/token/s</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Total Staked</p>
            <p className="mt-1 text-lg font-semibold text-white">0 GTK</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Your Share</p>
            <p className="mt-1 text-lg font-semibold text-white">0%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
