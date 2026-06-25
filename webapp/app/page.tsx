"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { GAME_LOGIC_ABI, GAME_ITEM_ABI, STAKING_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { isConnected, address, chain } = useAccount();

  const addrs = chain ? (CONTRACT_ADDRESSES as any)[chain.network] || CONTRACT_ADDRESSES.sepolia : CONTRACT_ADDRESSES.sepolia;

  const { data: xpBalance } = useReadContract({
    address: addrs?.gameLogic,
    abi: GAME_LOGIC_ABI,
    functionName: "xpBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameLogic, refetchInterval: 5000 },
  });

  const { data: itemsOwned } = useReadContract({
    address: addrs?.gameItem,
    abi: GAME_ITEM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameItem, refetchInterval: 5000 },
  });

  const { data: stakeInfo } = useReadContract({
    address: addrs?.staking,
    abi: STAKING_ABI,
    functionName: "stakes",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.staking, refetchInterval: 5000 },
  });

  const { data: earned } = useReadContract({
    address: addrs?.staking,
    abi: STAKING_ABI,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.staking, refetchInterval: 5000 },
  });

  const stakedAmount = stakeInfo?.[0] ?? 0n;
  const earnedXp = earned ?? 0n;

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
          href="/game"
        />
        <StatCard
          label="Items Owned"
          value={itemsOwned !== undefined ? itemsOwned.toString() : "—"}
          href="/items"
        />
        <StatCard
          label="Staked EDU"
          value={stakedAmount > 0n ? `${Number(formatEther(stakedAmount)).toFixed(2)}` : "0"}
          href="/staking"
        />
        <StatCard
          label="Staking XP/s"
          value={earnedXp > 0n ? `${Number(formatEther(earnedXp)).toFixed(2)}` : "0"}
          href="/staking"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/game" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-800/50">
          <span className="text-2xl">🎮</span>
          <h3 className="mt-3 font-semibold text-white">Game Hub</h3>
          <p className="mt-1 text-sm text-zinc-500">Upgrade items, manage XP, mint NFTs</p>
        </Link>
        <Link href="/quests" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-800/50">
          <span className="text-2xl">📋</span>
          <h3 className="mt-3 font-semibold text-white">Quests</h3>
          <p className="mt-1 text-sm text-zinc-500">Complete quests to earn XP and NFT rewards</p>
        </Link>
        <Link href="/staking" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-800/50">
          <span className="text-2xl">🔒</span>
          <h3 className="mt-3 font-semibold text-white">Staking</h3>
          <p className="mt-1 text-sm text-zinc-500">Stake EDU tokens to earn XP passively</p>
        </Link>
      </div>
    </div>
  );
}
