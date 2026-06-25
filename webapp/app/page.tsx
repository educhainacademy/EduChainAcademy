"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { GAME_LOGIC_ABI } from "@/lib/abis";
import { GAME_ITEM_ABI } from "@/lib/abis";
import { STAKING_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected, address, chain } = useAccount();

  const addrs = chain ? (CONTRACT_ADDRESSES as any)[chain.network]?. || CONTRACT_ADDRESSES.sepolia : CONTRACT_ADDRESSES.sepolia;

  const { data: xpBalance } = useReadContract({
    address: addrs?.gameLogic,
    abi: GAME_LOGIC_ABI,
    functionName: "xpBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameLogic },
  });

  const { data: itemsOwned } = useReadContract({
    address: addrs?.gameItem,
    abi: GAME_ITEM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameItem },
  });

  const { data: stakeInfo } = useReadContract({
    address: addrs?.staking,
    abi: STAKING_ABI,
    functionName: "stakes",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.staking },
  });

  const stakedAmount = stakeInfo?.[0] ?? 0n;

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Welcome to <span className="text-emerald-400">EduChain</span> Academy
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Learn blockchain, earn tokens, and build the future of finance.
            Connect your wallet to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="XP Balance"
          value={xpBalance !== undefined ? formatEther(xpBalance) : "—"}
        />
        <StatCard
          label="Items Owned"
          value={itemsOwned !== undefined ? itemsOwned.toString() : "—"}
        />
        <StatCard label="Quests Completed" value="—" />
        <StatCard
          label="Staked Tokens"
          value={stakedAmount > 0n ? `${Number(formatEther(stakedAmount)).toFixed(2)} EDU` : "0 EDU"}
        />
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <p className="mt-4 text-sm text-zinc-500">
            No recent activity. Complete quests or stake tokens to start earning XP.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Your Items</h2>
          <p className="mt-4 text-sm text-zinc-500">
            {itemsOwned !== undefined && Number(itemsOwned) > 0
              ? `You own ${itemsOwned.toString()} item(s).`
              : "No items yet. Complete quests to earn NFT rewards."}
          </p>
        </div>
      </div>
    </div>
  );
}
