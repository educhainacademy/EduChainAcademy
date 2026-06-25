"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function Header() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="text-emerald-400">Edu</span>Chain Academy
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Dashboard
          </Link>
          <Link href="/game" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Game
          </Link>
          <Link href="/quests" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Quests
          </Link>
          <Link href="/items" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Items
          </Link>
          <Link href="/staking" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Staking
          </Link>
        </nav>

        <div>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
