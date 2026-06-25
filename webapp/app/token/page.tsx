"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { EDU_TOKEN_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
}

export default function TokenPage() {
  const { isConnected, address, chain } = useAccount();
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  const addrs = getAddressesForChain(chain?.id);

  useEffect(() => {
    setPricesLoading(true);
    fetch("/api/prices?symbols=ETH&symbols=USDC&symbols=WBTC")
      .then((r) => r.json())
      .then((data) => setPrices(data.prices || []))
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, []);

  const { data: balance } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduToken, refetchInterval: 5000 },
  });

  const { data: totalSupply } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "totalSupply",
    query: { enabled: !!addrs?.eduToken, refetchInterval: 10000 },
  });

  const { data: remainingDaily } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "remainingDailyMintCapacity",
    query: { enabled: !!addrs?.eduToken, refetchInterval: 5000 },
  });

  const { data: remainingSupply } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "remainingSupplyCapacity",
    query: { enabled: !!addrs?.eduToken, refetchInterval: 10000 },
  });

  const MAX_SUPPLY = 1_000_000_000;
  const DAILY_CAP = 5_000_000;

  const supplyUsed = totalSupply !== undefined ? Number(formatEther(totalSupply)) : 0;
  const supplyPct = (supplyUsed / MAX_SUPPLY) * 100;

  const dailyUsed = remainingDaily !== undefined ? Number(formatEther(remainingDaily)) : DAILY_CAP;
  const dailyPct = ((DAILY_CAP - dailyUsed) / DAILY_CAP) * 100;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">EDU Token</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The utility token powering EduChain Academy. Earn through learning, stake for rewards, govern the platform.
        </p>
      </div>

      {/* Token Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Your Balance</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {isConnected && balance !== undefined ? formatEther(balance) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">EDU tokens</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Total Supply</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {totalSupply !== undefined ? formatEther(totalSupply) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">of {MAX_SUPPLY.toLocaleString()} EDU max</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Remaining Supply</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {remainingSupply !== undefined ? formatEther(remainingSupply) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">EDU unminted</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Daily Mint Remaining</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">
            {remainingDaily !== undefined ? formatEther(remainingDaily) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">of {DAILY_CAP.toLocaleString()} EDU/day</p>
        </div>
      </div>

      {/* Supply Visualization */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Supply Distribution</h2>
          <p className="mt-1 text-sm text-zinc-500">How much of the max supply has been minted</p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Minted</span>
              <span className="text-white">{supplyPct.toFixed(2)}%</span>
            </div>
            <div className="h-4 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(supplyPct, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-zinc-600">
              <span>{supplyUsed.toLocaleString()} EDU</span>
              <span>{MAX_SUPPLY.toLocaleString()} EDU</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Daily Mint Cap</h2>
          <p className="mt-1 text-sm text-zinc-500">Tokens minted today vs. daily limit</p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Used Today</span>
              <span className="text-white">{dailyPct.toFixed(2)}%</span>
            </div>
            <div className="h-4 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                style={{ width: `${Math.min(dailyPct, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-zinc-600">
              <span>{(DAILY_CAP - dailyUsed).toLocaleString()} EDU minted</span>
              <span>{DAILY_CAP.toLocaleString()} EDU cap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Prices (via Alchemy) */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Market Prices</h2>
            <p className="mt-1 text-sm text-zinc-500">Live prices powered by Alchemy</p>
          </div>
          {pricesLoading && (
            <span className="text-xs text-zinc-500">Loading...</span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {prices.length > 0 ? (
            prices.map((p) => (
              <div key={p.symbol} className="rounded-lg bg-zinc-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">{p.symbol}</span>
                  <span
                    className={`text-xs ${p.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {p.change24h >= 0 ? "+" : ""}
                    {p.change24h.toFixed(2)}%
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">
                  ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))
          ) : !pricesLoading ? (
            <div className="col-span-3 rounded-lg bg-zinc-800/50 p-4 text-center">
              <p className="text-sm text-zinc-500">
                {process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
                  ? "No price data available"
                  : "Set ALCHEMY_API_KEY to enable live prices"}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Token Features */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Token Features</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <span className="text-2xl">🔒</span>
            <h3 className="mt-2 font-medium text-white">ERC-2612 Permit</h3>
            <p className="mt-1 text-sm text-zinc-500">Gasless approvals via signed messages</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <span className="text-2xl">🔥</span>
            <h3 className="mt-2 font-medium text-white">Deflationary Burn</h3>
            <p className="mt-1 text-sm text-zinc-500">30% of revenue is burned permanently</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <span className="text-2xl">🌍</span>
            <h3 className="mt-2 font-medium text-white">Geo-Fencing</h3>
            <p className="mt-1 text-sm text-zinc-500">Compliance with restricted jurisdictions</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <span className="text-2xl">⏸️</span>
            <h3 className="mt-2 font-medium text-white">Pausable</h3>
            <p className="mt-1 text-sm text-zinc-500">Emergency stop for security incidents</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <span className="text-2xl">📊</span>
            <h3 className="mt-2 font-medium text-white">Supply Caps</h3>
            <p className="mt-1 text-sm text-zinc-500">Max 1B supply, 5M daily mint cap</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <span className="text-2xl">🛡️</span>
            <h3 className="mt-2 font-medium text-white">Access Control</h3>
            <p className="mt-1 text-sm text-zinc-500">Role-based minting with MINTER_ROLE</p>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Contract Details</h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Token Name</span>
            <span className="text-sm text-white">EduChain Academy (EDU)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Standard</span>
            <span className="text-sm text-white">ERC-20 + ERC-2612 Permit</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Decimals</span>
            <span className="text-sm text-white">18</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Max Supply</span>
            <span className="text-sm text-white">1,000,000,000 EDU</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Daily Mint Cap</span>
            <span className="text-sm text-white">5,000,000 EDU</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Network</span>
            <span className="text-sm text-white">{chain?.name || "Sepolia"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
