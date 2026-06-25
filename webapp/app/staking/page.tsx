"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { STAKING_ABI, GAME_LOGIC_ABI, EDU_TOKEN_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

export default function StakingPage() {
  const { isConnected, address, chain } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "staking">("idle");

  const addrs = getAddressesForChain(chain?.id);

  const { data: stakeInfo, refetch: refetchStake } = useReadContract({
    address: addrs?.staking,
    abi: STAKING_ABI,
    functionName: "stakes",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.staking, refetchInterval: 5000 },
  });

  const { data: earned, refetch: refetchEarned } = useReadContract({
    address: addrs?.staking,
    abi: STAKING_ABI,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.staking, refetchInterval: 5000 },
  });

  const { data: rewardRate } = useReadContract({
    address: addrs?.staking,
    abi: STAKING_ABI,
    functionName: "rewardRate",
    query: { enabled: !!addrs?.staking },
  });

  const { data: xpBalance } = useReadContract({
    address: addrs?.gameLogic,
    abi: GAME_LOGIC_ABI,
    functionName: "xpBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameLogic, refetchInterval: 5000 },
  });

  const { data: allowance } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "allowance",
    args: address && addrs?.staking ? [address, addrs.staking] : undefined,
    query: { enabled: !!address && !!addrs?.eduToken && !!addrs?.staking, refetchInterval: 5000 },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const stakedAmount = stakeInfo?.[0] ?? 0n;
  const earnedXp = earned ?? 0n;
  const needsApproval = stakeAmount ? parseEther(stakeAmount) > (allowance ?? 0n) : false;

  const handleApprove = () => {
    if (!stakeAmount || !addrs?.eduToken || !addrs?.staking) return;
    setStep("approving");
    writeContract({
      address: addrs.eduToken,
      abi: EDU_TOKEN_ABI,
      functionName: "approve",
      args: [addrs.staking, parseEther(stakeAmount)],
    });
  };

  const handleStake = () => {
    if (!stakeAmount || !addrs?.staking) return;
    setStep("staking");
    writeContract({
      address: addrs.staking,
      abi: STAKING_ABI,
      functionName: "stake",
      args: [parseEther(stakeAmount)],
    });
  };

  const handleStakeClick = () => {
    if (needsApproval) {
      handleApprove();
    } else {
      handleStake();
    }
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !addrs?.staking) return;
    writeContract({
      address: addrs.staking,
      abi: STAKING_ABI,
      functionName: "withdraw",
      args: [parseEther(withdrawAmount)],
    });
  };

  const handleClaim = () => {
    if (!addrs?.staking) return;
    writeContract({
      address: addrs.staking,
      abi: STAKING_ABI,
      functionName: "claimRewards",
    });
  };

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
          Stake EDU tokens to earn XP over time. XP rewards accumulate every second.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stake Panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Your Stake</h2>
          <p className="mt-4 text-3xl font-bold text-emerald-400">
            {stakedAmount > 0n ? `${Number(formatEther(stakedAmount)).toFixed(4)}` : "0"} EDU
          </p>
          <p className="mt-2 text-sm text-zinc-500">Currently staked</p>

          <div className="mt-6 flex gap-3">
            <input
              type="number"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleStakeClick}
              disabled={!stakeAmount || isPending || isConfirming}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending || isConfirming
                ? step === "approving"
                  ? "Approving..."
                  : "Staking..."
                : needsApproval
                ? "Approve & Stake"
                : "Stake"}
            </button>
          </div>

          {needsApproval && stakeAmount && (
            <p className="mt-2 text-xs text-amber-400">
              First-time staking requires an EDU token approval transaction.
            </p>
          )}

          {stakedAmount > 0n && (
            <div className="mt-4 flex gap-3">
              <input
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isPending || isConfirming}
                className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
              >
                {isPending || isConfirming ? "..." : "Withdraw"}
              </button>
            </div>
          )}
        </div>

        {/* Rewards Panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Rewards</h2>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              {earnedXp > 0n ? formatEther(earnedXp) : "0"}
            </p>
            <span className="text-sm text-zinc-500">XP earned</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">Accrued from staking</p>

          <div className="mt-4 rounded-lg bg-zinc-800/50 p-3">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Total XP Balance</span>
              <span className="text-white">{xpBalance !== undefined ? formatEther(xpBalance) : "—"} XP</span>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={earnedXp === 0n || isPending || isConfirming}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {isPending || isConfirming ? "Processing..." : "Claim Rewards"}
          </button>
        </div>
      </div>

      {/* Staking Info */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Staking Info</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-500">Reward Rate</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {rewardRate !== undefined ? `${Number(rewardRate)} XP/token/s` : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Your Stake</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {stakedAmount > 0n ? `${Number(formatEther(stakedAmount)).toFixed(4)} EDU` : "0 EDU"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Earned (live)</p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">
              {earnedXp > 0n ? `${Number(formatEther(earnedXp)).toFixed(4)} XP` : "0 XP"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
