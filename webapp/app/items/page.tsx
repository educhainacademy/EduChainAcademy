"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { GAME_ITEM_ABI, GAME_LOGIC_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

interface AlchemyNFT {
  id: number;
  name: string;
  image: string;
  description: string;
  level: number;
}

export default function ItemsPage() {
  const { isConnected, address, chain } = useAccount();
  const [items, setItems] = useState<{ id: number; level: number; uri: string; name?: string; image?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const addrs = getAddressesForChain(chain?.id);

  const { data: balance } = useReadContract({
    address: addrs?.gameItem,
    abi: GAME_ITEM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.gameItem },
  });

  const count = balance !== undefined ? Number(balance) : 0;

  useEffect(() => {
    if (!address || !addrs?.gameItem || count === 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    const chainName = chain?.id === 80002 ? "polygonAmoy" : "sepolia";

    async function loadItems() {
      // Try Alchemy NFT API first for richer metadata
      if (addrs.gameItem && address) {
        try {
          const alchemyRes = await fetch(
            `/api/nfts?owner=${address}&contracts=${addrs.gameItem}`
          );
          const alchemyData = await alchemyRes.json();

          if (alchemyData.nfts?.length > 0) {
            const alchemyItems: { id: number; level: number; uri: string; name?: string; image?: string }[] = [];
            for (const nft of alchemyData.nfts) {
              const levelRes = await fetch(
                `/api/contract?address=${addrs.gameLogic}&fn=itemLevel&arg=${nft.tokenId}&chain=${chainName}`
              );
              const levelData = await levelRes.json();
              alchemyItems.push({
                id: parseInt(nft.tokenId),
                level: levelData.result ?? 0,
                uri: "",
                name: nft.name,
                image: nft.image,
              });
            }
            setItems(alchemyItems);
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to on-chain method
        }
      }

      // Fallback: on-chain token enumeration
      const fetched: { id: number; level: number; uri: string }[] = [];

      for (let i = 0; i < 50 && fetched.length < count; i++) {
        try {
          const ownerRes = await fetch(
            `/api/contract?address=${addrs.gameItem}&fn=ownerOf&arg=${i}&chain=${chainName}`
          );
          const ownerData = await ownerRes.json();

          if (ownerData.result?.toLowerCase() === address?.toLowerCase()) {
            const [uriRes, levelRes] = await Promise.all([
              fetch(`/api/contract?address=${addrs.gameItem}&fn=tokenURI&arg=${i}&chain=${chainName}`),
              fetch(`/api/contract?address=${addrs.gameLogic}&fn=itemLevel&arg=${i}&chain=${chainName}`),
            ]);

            const uriData = await uriRes.json();
            const levelData = await levelRes.json();

            fetched.push({
              id: i,
              level: levelData.result ?? 0,
              uri: uriData.result ?? "",
            });
          }
        } catch {
          // Skip failed lookups
        }
      }

      setItems(fetched);
      setLoading(false);
    }

    loadItems();
  }, [address, addrs, count, chain]);

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
          {count > 0
            ? `You own ${count} NFT item${count > 1 ? "s" : ""}.`
            : "No items yet. Complete quests or mint items to get started."}
        </p>
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <span className="text-5xl">🎒</span>
          <h2 className="mt-4 text-lg font-semibold text-white">Empty Inventory</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Complete quests to earn NFT rewards, or visit the Game Hub to mint items.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="/quests"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Go to Quests
            </a>
            <a
              href="/game"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Game Hub
            </a>
          </div>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500">Loading items from chain...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name || `Item #${item.id}`}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-3xl">⚔️</span>
                )}
                <span className="rounded-full bg-amber-900/50 px-3 py-1 text-xs font-medium text-amber-400">
                  Lv. {item.level}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-white">
                {item.name || `Item #${item.id}`}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 truncate">
                {item.uri || "Token ID: " + item.id}
              </p>
            </div>
          ))}
          {items.length < count && (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 opacity-40">
              <span className="text-3xl">❓</span>
              <h3 className="mt-3 font-semibold text-zinc-500">
                {count - items.length} more item(s)
              </h3>
              <p className="mt-1 text-xs text-zinc-600">
                Could not resolve all token IDs
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
