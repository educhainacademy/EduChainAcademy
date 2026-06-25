"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { GAME_LOGIC_ABI, GAME_ITEM_ABI, STAKING_ABI, EDU_TOKEN_ABI, EDU_PLATFORM_ABI, GOVERNANCE_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

interface PortfolioToken {
  symbol: string;
  balance: string;
  balanceUSD: number;
  price: number;
}

export default function ProfilePage() {
  const { isConnected, address, chain } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioToken[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const addrs = getAddressesForChain(chain?.id);

  // Game stats
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

  // Staking stats
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

  // Token stats
  const { data: eduBalance } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduToken, refetchInterval: 5000 },
  });

  // Platform stats
  const { data: learnerStats } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "getLearnerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduPlatform },
  });

  const { data: profile } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "profiles",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduPlatform },
  });

  // Governance stats
  const { data: proposalCount } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "proposalCount",
    query: { enabled: !!addrs?.governance },
  });

  useEffect(() => {
    if (!address) return;
    setPortfolioLoading(true);
    fetch(`/api/portfolio?addresses=${address}`)
      .then((r) => r.json())
      .then((data) => setPortfolio(data.portfolio || []))
      .catch(() => {})
      .finally(() => setPortfolioLoading(false));
  }, [address]);

  const stakedAmount = stakeInfo?.[0] ?? 0n;
  const earnedXp = earned ?? 0n;
  const isRegistered = profile?.[5] ?? false;
  const kycTier = profile?.[0] ?? 0n;
  const totalXp = learnerStats?.[1] ?? 0n;
  const coursesCompleted = learnerStats?.[2] ?? 0n;

  const kycLabels: Record<number, { label: string; color: string }> = {
    0: { label: "Unverified", color: "text-zinc-400" },
    1: { label: "Basic", color: "text-blue-400" },
    2: { label: "Enhanced", color: "text-emerald-400" },
  };

  const kycInfo = kycLabels[Number(kycTier)] || kycLabels[0];

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your on-chain learner profile and platform activity.
        </p>
      </div>

      {/* Wallet Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/50 text-2xl font-bold text-emerald-400">
            {address?.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm text-zinc-500">
                {chain?.name || "Sepolia"}
              </span>
              {isRegistered && (
                <span className={`rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium ${kycInfo.color}`}>
                  KYC: {kycInfo.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">XP Balance</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {xpBalance !== undefined ? formatEther(xpBalance) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">from quests & staking</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">EDU Balance</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">
            {eduBalance !== undefined ? formatEther(eduBalance) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">utility tokens</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Items Owned</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {itemsOwned !== undefined ? itemsOwned.toString() : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">NFT game items</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Staked EDU</p>
          <p className="mt-2 text-3xl font-bold text-purple-400">
            {stakedAmount > 0n ? formatEther(stakedAmount) : "0"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            +{earnedXp > 0n ? formatEther(earnedXp) : "0"} XP earned
          </p>
        </div>
      </div>

      {/* Wallet Portfolio (via Alchemy) */}
      {portfolio.length > 0 && (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Wallet Portfolio</h2>
              <p className="mt-1 text-sm text-zinc-500">Token balances across chains via Alchemy</p>
            </div>
            {portfolioLoading && <span className="text-xs text-zinc-500">Loading...</span>}
          </div>
          <div className="mt-4 space-y-3">
            {portfolio.slice(0, 10).map((token) => (
              <div key={token.symbol + token.balance} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-white">{token.symbol}</span>
                  <span className="ml-2 text-xs text-zinc-500">
                    ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {Number(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </p>
                  <p className="text-xs text-zinc-500">
                    ${token.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Progress */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Learning Progress</h2>
          {isRegistered ? (
            <div className="mt-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Courses Completed</span>
                <span className="text-sm font-semibold text-white">{Number(coursesCompleted)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Total XP Earned</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {totalXp > 0n ? formatEther(totalXp) : "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">KYC Tier</span>
                <span className={`text-sm font-semibold ${kycInfo.color}`}>{kycInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Registration Status</span>
                <span className="text-sm font-semibold text-emerald-400">Active</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-8">
              <p className="text-sm text-zinc-500">Not registered yet</p>
              <a
                href="/courses"
                className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Go to Courses to Register
              </a>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Platform Activity</h2>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Proposals Created</span>
              <span className="text-sm font-semibold text-white">
                {proposalCount !== undefined ? Number(proposalCount) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Network</span>
              <span className="text-sm font-semibold text-white">{chain?.name || "Sepolia"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Account</span>
              <span className="text-sm font-mono text-zinc-400">
                {address?.slice(0, 10)}...{address?.slice(-6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="/courses"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-800/50"
        >
          <span className="text-xl">📚</span>
          <h3 className="mt-2 font-medium text-white text-sm">Courses</h3>
          <p className="mt-1 text-xs text-zinc-500">Earn EDU tokens</p>
        </a>
        <a
          href="/membership"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-800/50"
        >
          <span className="text-xl">🪪</span>
          <h3 className="mt-2 font-medium text-white text-sm">Membership</h3>
          <p className="mt-1 text-xs text-zinc-500">NFT access pass</p>
        </a>
        <a
          href="/quests"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-800/50"
        >
          <span className="text-xl">📋</span>
          <h3 className="mt-2 font-medium text-white text-sm">Quests</h3>
          <p className="mt-1 text-xs text-zinc-500">Complete for XP</p>
        </a>
        <a
          href="/staking"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-800/50"
        >
          <span className="text-xl">🔒</span>
          <h3 className="mt-2 font-medium text-white text-sm">Staking</h3>
          <p className="mt-1 text-xs text-zinc-500">Earn XP passively</p>
        </a>
        <a
          href="/governance"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-800/50"
        >
          <span className="text-xl">🏛️</span>
          <h3 className="mt-2 font-medium text-white text-sm">Governance</h3>
          <p className="mt-1 text-xs text-zinc-500">Vote on proposals</p>
        </a>
      </div>
    </div>
  );
}
