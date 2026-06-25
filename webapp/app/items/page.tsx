"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { GAME_ITEM_ABI, GAME_LOGIC_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

interface Item {
  tokenId: number;
  level: number;
  uri: string;
}

export default function ItemsPage() {
  const { isConnected, address, chain } = useAccount();
  const [items, setItems] = useState<Item[]>([]);

  const addrs = chain ? (CONTRACT_ADDRESSES as any)[chain.network] || CONTRACT_ADDRESSES.sepolia : CONTRACT_ADDRESSES.sepolia;

  const { data: balance } = useReadContract({
    address: addrs?.gameItem,
    abi: GAME_ITEM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameItem },
  });

  const count = balance !== undefined ? Number(balance) : 0;

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to view your items.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Your Items</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {count > 0 ? `You own ${count} NFT item(s).` : "No items yet. Complete quests or mint items to get started."}
        </p>
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <span className="text-5xl">🎒</span>
          <h2 className="mt-4 text-lg font-semibold text-white">Empty Inventory</h2>
          <p className="mt-2 text-sm text-zinc-500">Complete quests to earn NFT rewards, or visit the Game Hub to mint items.</p>
          <div className="mt-6 flex justify-center gap-4">
            <a href="/quests" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
              Go to Quests
            </a>
            <a href="/game" className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white">
              Game Hub
            </a>
          </div>
        </div>
      ) : (
        <ItemGrid address={address} count={count} addrs={addrs} />
      )}
    </div>
  );
}

function ItemGrid({ address, count, addrs }: { address: `0x${string}`; count: number; addrs: any }) {
  const [items, setItems] = useState<{ id: number; level: number; uri: string }[]>([]);

  useEffect(() => {
    if (!address || !addrs?.gameItem || count === 0) return;

    async function loadItems() {
      const fetched: { id: number; level: number; uri: string }[] = [];

      for (let i = 0; i < count; i++) {
        try {
          // We need to get token IDs from transfer events or try sequential IDs
          // For now, try IDs 0 through count-1 as a reasonable guess
          const tokenId = BigInt(i);
          const owner = await fetchOwner(addrs.gameItem, tokenId);
          if (owner?.toLowerCase() === address.toLowerCase()) {
            const uri = await fetchUri(addrs.gameItem, tokenId);
            const level = await fetchLevel(addrs.gameLogic, tokenId);
            fetched.push({ id: i, level, uri });
          }
        } catch {
          // Token doesn't exist or not owned
        }
      }

      setItems(fetched);
    }

    loadItems();
  }, [address, count, addrs]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 && count > 0 && (
        <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500">Loading items...</p>
        </div>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">⚔️</span>
            <span className="rounded-full bg-amber-900/50 px-3 py-1 text-xs font-medium text-amber-400">
              Lv. {item.level}
            </span>
          </div>
          <h3 className="mt-3 font-semibold text-white">Item #{item.id}</h3>
          <p className="mt-1 text-xs text-zinc-500 truncate">{item.uri || "No metadata"}</p>
        </div>
      ))}
    </div>
  );
}

// Simple fetch helpers using raw contract calls
async function fetchOwner(contractAddress: string, tokenId: bigint): Promise<string | null> {
  try {
    const res = await fetch(`/api/contract?address=${contractAddress}&fn=ownerOf&arg=${tokenId}`);
    const data = await res.json();
    return data.result;
  } catch {
    return null;
  }
}

async function fetchUri(contractAddress: string, tokenId: bigint): Promise<string> {
  try {
    const res = await fetch(`/api/contract?address=${contractAddress}&fn=tokenURI&arg=${tokenId}`);
    const data = await res.json();
    return data.result;
  } catch {
    return "";
  }
}

async function fetchLevel(contractAddress: string, tokenId: bigint): Promise<number> {
  try {
    const res = await fetch(`/api/contract?address=${contractAddress}&fn=itemLevel&arg=${tokenId}`);
    const data = await res.json();
    return Number(data.result);
  } catch {
    return 0;
  }
}
