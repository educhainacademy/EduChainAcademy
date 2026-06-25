"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { GAME_LOGIC_ABI, GAME_ITEM_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

export default function GamePage() {
  const { isConnected, address, chain } = useAccount();
  const [upgradeTokenId, setUpgradeTokenId] = useState("");
  const [upgradeCost, setUpgradeCost] = useState("10");
  const [mintTo, setMintTo] = useState("");
  const [mintUri, setMintUri] = useState("");
  const [mintXp, setMintXp] = useState("0");

  const addrs = chain ? (CONTRACT_ADDRESSES as any)[chain.network] || CONTRACT_ADDRESSES.sepolia : CONTRACT_ADDRESSES.sepolia;

  const { data: xpBalance, refetch: refetchXp } = useReadContract({
    address: addrs?.gameLogic,
    abi: GAME_LOGIC_ABI,
    functionName: "xpBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameLogic, refetchInterval: 5000 },
  });

  const { data: itemsBalance } = useReadContract({
    address: addrs?.gameItem,
    abi: GAME_ITEM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameItem, refetchInterval: 5000 },
  });

  const { data: itemLevel } = useReadContract({
    address: addrs?.gameLogic,
    abi: GAME_LOGIC_ABI,
    functionName: "itemLevel",
    args: upgradeTokenId ? [BigInt(upgradeTokenId)] : undefined,
    query: { enabled: !!upgradeTokenId && !!addrs?.gameLogic },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleUpgrade = () => {
    if (!upgradeTokenId || !addrs?.gameLogic) return;
    writeContract({
      address: addrs.gameLogic,
      abi: GAME_LOGIC_ABI,
      functionName: "upgradeItem",
      args: [BigInt(upgradeTokenId), parseEther(upgradeCost)],
    });
  };

  const handleMintItem = () => {
    if (!mintTo || !mintUri || !addrs?.gameLogic) return;
    writeContract({
      address: addrs.gameLogic,
      abi: GAME_LOGIC_ABI,
      functionName: "mintItem",
      args: [mintTo as `0x${string}`, mintUri, parseEther(mintXp)],
    });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to access the game.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Game Hub</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your XP, mint items, and upgrade your inventory.
        </p>
      </div>

      {/* XP & Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">XP Balance</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {xpBalance !== undefined ? formatEther(xpBalance) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Items Owned</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {itemsBalance !== undefined ? itemsBalance.toString() : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Item Level</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {itemLevel !== undefined ? `Lv. ${itemLevel}` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Upgrade Item */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Upgrade Item</h2>
          <p className="mt-1 text-sm text-zinc-500">Spend XP to level up your NFT items</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-500">Token ID</label>
              <input
                type="number"
                placeholder="e.g. 0"
                value={upgradeTokenId}
                onChange={(e) => setUpgradeTokenId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">XP Cost</label>
              <input
                type="number"
                placeholder="10"
                value={upgradeCost}
                onChange={(e) => setUpgradeCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={!upgradeTokenId || !upgradeCost || isPending || isConfirming}
            className="mt-4 w-full rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {isPending || isConfirming ? "Upgrading..." : "Upgrade Item"}
          </button>
        </div>

        {/* Mint Item (Admin) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Mint Item</h2>
          <p className="mt-1 text-sm text-zinc-500">Mint a new NFT item (owner only)</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-500">Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Metadata URI</label>
              <input
                type="text"
                placeholder="ipfs://..."
                value={mintUri}
                onChange={(e) => setMintUri(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Initial XP</label>
              <input
                type="number"
                placeholder="0"
                value={mintXp}
                onChange={(e) => setMintXp(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleMintItem}
            disabled={!mintTo || !mintUri || isPending || isConfirming}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending || isConfirming ? "Minting..." : "Mint Item"}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <a href="/items" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
          <h3 className="font-semibold text-white">View Items</h3>
          <p className="mt-1 text-sm text-zinc-500">Browse your NFT inventory</p>
        </a>
        <a href="/quests" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
          <h3 className="font-semibold text-white">Complete Quests</h3>
          <p className="mt-1 text-sm text-zinc-500">Earn XP and NFT rewards</p>
        </a>
        <a href="/staking" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
          <h3 className="font-semibold text-white">Stake Tokens</h3>
          <p className="mt-1 text-sm text-zinc-500">Earn XP passively</p>
        </a>
      </div>
    </div>
  );
}
