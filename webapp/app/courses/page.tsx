"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { EDU_PLATFORM_ABI, EDU_TOKEN_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

const COURSE_META: Record<number, { title: string; description: string; icon: string; difficulty: string }> = {
  1: {
    title: "Introduction to Blockchain",
    description: "Learn the fundamentals of distributed ledger technology, consensus mechanisms, and cryptographic hashing.",
    icon: "⛓️",
    difficulty: "Beginner",
  },
  2: {
    title: "Smart Contract Development",
    description: "Master Solidity fundamentals, deploy contracts, and understand the EVM execution model.",
    icon: "📜",
    difficulty: "Intermediate",
  },
  3: {
    title: "DeFi Fundamentals",
    description: "Explore decentralized exchanges, lending protocols, yield farming, and liquidity provision.",
    icon: "💰",
    difficulty: "Intermediate",
  },
  4: {
    title: "Real Estate Tokenization",
    description: "Learn how real-world assets become on-chain tokens and the legal framework behind it.",
    icon: "🏠",
    difficulty: "Advanced",
  },
  5: {
    title: "Web3 Security",
    description: "Protect yourself and your assets: audit patterns, wallet security, and threat vectors.",
    icon: "🛡️",
    difficulty: "Intermediate",
  },
};

export default function CoursesPage() {
  const { isConnected, address, chain } = useAccount();
  const [registering, setRegistering] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const addrs = getAddressesForChain(chain?.id);

  const { data: courseCount } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "courseCount",
    query: { enabled: !!addrs?.eduPlatform, refetchInterval: 5000 },
  });

  const { data: profile } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "profiles",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduPlatform, refetchInterval: 5000 },
  });

  const { data: eduBalance } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduToken, refetchInterval: 5000 },
  });

  const { data: totalBurned } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "totalBurned",
    query: { enabled: !!addrs?.eduPlatform },
  });

  const { data: learnerStats } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "getLearnerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduPlatform },
  });

  const count = courseCount !== undefined ? Number(courseCount) : 0;
  const courseIds = Array.from({ length: count }, (_, i) => i + 1);

  const isRegistered = profile?.[5] ?? false;
  const kycTier = profile?.[0] ?? 0n;

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleRegister = async () => {
    if (!addrs?.eduPlatform) return;
    setRegistering(true);
    writeContract({
      address: addrs.eduPlatform,
      abi: EDU_PLATFORM_ABI,
      functionName: "registerLearner",
    });
    setRegistering(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to access courses.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Complete courses to earn EDU tokens and build your on-chain credentials.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Your EDU Balance</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {eduBalance !== undefined ? formatEther(eduBalance) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">KYC Tier</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {isRegistered ? `Tier ${kycTier}` : "Not Registered"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Courses Completed</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {learnerStats ? Number(learnerStats[2]) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Total EDU Burned</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {totalBurned !== undefined ? formatEther(totalBurned) : "—"}
          </p>
        </div>
      </div>

      {/* Registration Banner */}
      {!isRegistered && (
        <div className="mt-6 rounded-2xl border border-amber-800/50 bg-amber-900/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Register as a Learner</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Create your on-chain learner profile to start earning EDU rewards.
              </p>
            </div>
            <button
              onClick={handleRegister}
              disabled={isPending || isConfirming || registering}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending || isConfirming ? "Registering..." : "Register"}
            </button>
          </div>
        </div>
      )}

      {/* Daily Remaining */}
      {isRegistered && learnerStats && (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Daily Reward Remaining</span>
            <span className="text-sm font-semibold text-emerald-400">
              {formatEther(learnerStats[3])} EDU
            </span>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="mt-8 grid gap-4">
        {courseIds.map((id) => (
          <CourseCard
            key={id}
            id={id}
            addrs={addrs}
            address={address}
            isRegistered={isRegistered}
            kycTier={Number(kycTier)}
            isPending={isPending}
            isConfirming={isConfirming}
            completingId={completingId}
            setCompletingId={setCompletingId}
          />
        ))}
      </div>

      {count === 0 && (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <span className="text-5xl">📚</span>
          <h3 className="mt-4 text-lg font-semibold text-white">No Courses Available</h3>
          <p className="mt-2 text-sm text-zinc-500">Courses will be added by the platform admin.</p>
        </div>
      )}
    </div>
  );
}

function CourseCard({
  id,
  addrs,
  address,
  isRegistered,
  kycTier,
  isPending,
  isConfirming,
  completingId,
  setCompletingId,
}: {
  id: number;
  addrs: any;
  address: string | undefined;
  isRegistered: boolean;
  kycTier: number;
  isPending: boolean;
  isConfirming: boolean;
  completingId: number | null;
  setCompletingId: (id: number | null) => void;
}) {
  const { data: course } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "courses",
    args: [BigInt(id)],
    query: { enabled: !!addrs?.eduPlatform },
  });

  const { data: completed } = useReadContract({
    address: addrs?.eduPlatform,
    abi: EDU_PLATFORM_ABI,
    functionName: "courseCompleted",
    args: address ? [address as `0x${string}`, BigInt(id)] : undefined,
    query: { enabled: !!address && !!addrs?.eduPlatform },
  });

  const { writeContract } = useWriteContract();

  if (!course) return null;

  const exists = course[0] as bigint;
  const eduReward = course[1] as bigint;
  const credentialPrice = course[2] as bigint;
  const active = course[3] as boolean;
  const metadataUri = course[4] as string;

  if (!active) return null;

  const meta = COURSE_META[id] || {
    title: `Course ${id}`,
    description: metadataUri || "No description available",
    icon: "📖",
    difficulty: "All Levels",
  };

  const isCompleted = completed ?? false;

  const handleComplete = () => {
    if (!addrs?.eduPlatform) return;
    setCompletingId(id);
    writeContract({
      address: addrs.eduPlatform,
      abi: EDU_PLATFORM_ABI,
      functionName: "completeCourse",
      args: [BigInt(id)],
    });
    setTimeout(() => setCompletingId(null), 2000);
  };

  const difficultyColors: Record<string, string> = {
    Beginner: "bg-emerald-900/50 text-emerald-400",
    Intermediate: "bg-amber-900/50 text-amber-400",
    Advanced: "bg-red-900/50 text-red-400",
    "All Levels": "bg-zinc-800 text-zinc-400",
  };

  return (
    <div
      className={`rounded-2xl border p-6 transition-colors ${
        isCompleted
          ? "border-emerald-800/50 bg-emerald-900/10"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-white">{meta.title}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColors[meta.difficulty]}`}>
                {meta.difficulty}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 max-w-2xl">{meta.description}</p>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-sm font-medium text-emerald-400">
                +{formatEther(eduReward)} EDU Reward
              </span>
              {credentialPrice > 0n && (
                <span className="text-sm text-zinc-500">
                  Credential: {formatEther(credentialPrice)} EDU
                </span>
              )}
              {metadataUri && (
                <span className="text-xs text-zinc-600 truncate max-w-xs">{metadataUri}</span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          {isCompleted ? (
            <span className="rounded-full bg-emerald-900/50 px-4 py-1.5 text-xs font-medium text-emerald-400">
              Completed
            </span>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!isRegistered || kycTier < 1 || isPending || isConfirming || completingId === id}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {completingId === id
                ? "Completing..."
                : !isRegistered
                ? "Register First"
                : kycTier < 1
                ? "KYC Required"
                : "Complete Course"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
