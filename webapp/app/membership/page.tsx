"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { MEMBERSHIP_NFT_ABI } from "@/lib/abis";
import { getAddressesForChain } from "@/lib/contracts";

const TIER_LABELS = ["Basic", "Standard", "Premium"];
const TIER_COLORS = ["text-zinc-400", "text-blue-400", "text-amber-400"];
const TIER_ICONS = ["📋", "⭐", "👑"];

export default function MembershipPage() {
  const { isConnected, address, chain } = useAccount();
  const [nftCount, setNftCount] = useState(0);

  const addrs = getAddressesForChain(chain?.id);

  const { data: isActive } = useReadContract({
    address: addrs?.membershipNFT,
    abi: MEMBERSHIP_NFT_ABI,
    functionName: "isActiveMember",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.membershipNFT, refetchInterval: 5000 },
  });

  const { data: tier } = useReadContract({
    address: addrs?.membershipNFT,
    abi: MEMBERSHIP_NFT_ABI,
    functionName: "getMembershipTier",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.membershipNFT },
  });

  const { data: totalMinted } = useReadContract({
    address: addrs?.membershipNFT,
    abi: MEMBERSHIP_NFT_ABI,
    functionName: "totalMinted",
    query: { enabled: !!addrs?.membershipNFT, refetchInterval: 10000 },
  });

  const { data: maxSupply } = useReadContract({
    address: addrs?.membershipNFT,
    abi: MEMBERSHIP_NFT_ABI,
    functionName: "maxSupply",
    query: { enabled: !!addrs?.membershipNFT },
  });

  const tierNum = tier !== undefined ? Number(tier) : 0;
  const minted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const max = maxSupply !== undefined ? Number(maxSupply) : 10000;

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to view membership.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Membership</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ARCHON-IX Membership NFT — your key to premium EduChain Academy features.
        </p>
      </div>

      {/* Membership Status */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="flex items-center gap-6">
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl text-4xl ${
            isActive ? "bg-emerald-900/50" : "bg-zinc-800"
          }`}>
            {isActive ? TIER_ICONS[tierNum] : "🔒"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isActive ? `${TIER_LABELS[tierNum]} Member` : "Not a Member"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isActive
                ? "Your membership is active. Enjoy premium features!"
                : "Mint a membership NFT to unlock premium features."}
            </p>
            {isActive && (
              <span className={`mt-2 inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium ${TIER_COLORS[tierNum]}`}>
                Tier {tierNum + 1} — {TIER_LABELS[tierNum]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Total Minted</p>
          <p className="mt-2 text-3xl font-bold text-white">{minted}</p>
          <p className="mt-1 text-xs text-zinc-600">of {max.toLocaleString()} max</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Mint Price</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">0.01 ETH</p>
          <p className="mt-1 text-xs text-zinc-600">one-time payment</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Network</p>
          <p className="mt-2 text-3xl font-bold text-white">Sepolia</p>
          <p className="mt-1 text-xs text-zinc-600">testnet</p>
        </div>
      </div>

      {/* Membership Tiers */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Membership Tiers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {TIER_LABELS.map((label, i) => (
            <div
              key={label}
              className={`rounded-lg p-4 ${
                isActive && tierNum === i
                  ? "bg-emerald-900/30 border border-emerald-800/50"
                  : "bg-zinc-800/50"
              }`}
            >
              <span className="text-2xl">{TIER_ICONS[i]}</span>
              <h3 className="mt-2 font-medium text-white">{label}</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-500">
                <li>• Access to courses</li>
                {i >= 1 && <li>• Priority quest rewards</li>}
                {i >= 1 && <li>• Governance voting</li>}
                {i >= 2 && <li>• Exclusive NFT drops</li>}
                {i >= 2 && <li>• Premium community</li>}
              </ul>
              {isActive && tierNum === i && (
                <span className="mt-3 inline-block rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-400">
                  Your Tier
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contract Info */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Contract Details</h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Collection Name</span>
            <span className="text-sm text-white">EduChain Academy Membership</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Symbol</span>
            <span className="text-sm text-white">ECHAIN-MEMBER</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Standard</span>
            <span className="text-sm text-white">ERC-721</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Contract</span>
            <a
              href={`https://eth-sepolia.blockscout.com/address/${addrs?.membershipNFT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:underline"
            >
              {addrs?.membershipNFT?.slice(0, 6)}...{addrs?.membershipNFT?.slice(-4)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
