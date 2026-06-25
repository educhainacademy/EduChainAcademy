"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { GOVERNANCE_ABI, EDU_TOKEN_ABI } from "@/lib/abis";
import { CONTRACT_ADDRESSES, getAddressesForChain } from "@/lib/contracts";

const PROPOSAL_META: Record<number, { title: string; description: string }> = {};

export default function GovernancePage() {
  const { isConnected, address, chain } = useAccount();
  const [description, setDescription] = useState("");
  const [voteProposalId, setVoteProposalId] = useState("");
  const [voteSupport, setVoteSupport] = useState(true);

  const addrs = getAddressesForChain(chain?.id);

  const { data: proposalCount } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "proposalCount",
    query: { enabled: !!addrs?.governance, refetchInterval: 5000 },
  });

  const { data: votingPeriod } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "votingPeriod",
    query: { enabled: !!addrs?.governance },
  });

  const { data: quorumThreshold } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "quorumThreshold",
    query: { enabled: !!addrs?.governance },
  });

  const { data: proposalThreshold } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "proposalThreshold",
    query: { enabled: !!addrs?.governance },
  });

  const { data: eduBalance } = useReadContract({
    address: addrs?.eduToken,
    abi: EDU_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.eduToken, refetchInterval: 5000 },
  });

  const count = proposalCount !== undefined ? Number(proposalCount) : 0;
  const proposalIds = Array.from({ length: count }, (_, i) => i + 1);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleCreateProposal = () => {
    if (!description.trim() || !addrs?.governance) return;
    writeContract({
      address: addrs.governance,
      abi: GOVERNANCE_ABI,
      functionName: "createProposal",
      args: [description],
    });
    setDescription("");
  };

  const handleVote = () => {
    if (!voteProposalId || !addrs?.governance) return;
    writeContract({
      address: addrs.governance,
      abi: GOVERNANCE_ABI,
      functionName: "vote",
      args: [BigInt(voteProposalId), voteSupport],
    });
    setVoteProposalId("");
  };

  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <p className="text-lg text-zinc-400">Connect your wallet to access governance.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Governance</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create proposals and vote with your EDU tokens to shape the platform.
        </p>
      </div>

      {/* Governance Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Total Proposals</p>
          <p className="mt-2 text-3xl font-bold text-white">{count}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Your EDU Balance</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {eduBalance !== undefined ? formatEther(eduBalance) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Voting Period</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {votingPeriod !== undefined ? `${votingPeriod} blocks` : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Quorum</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {quorumThreshold !== undefined ? formatEther(quorumThreshold) : "—"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Create Proposal */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Create Proposal</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Requires {proposalThreshold !== undefined ? formatEther(proposalThreshold) : "—"} EDU balance
          </p>

          <div className="mt-4">
            <label className="text-xs text-zinc-500">Description</label>
            <textarea
              placeholder="Describe your proposal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <button
            onClick={handleCreateProposal}
            disabled={!description.trim() || isPending || isConfirming}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending || isConfirming ? "Creating..." : "Create Proposal"}
          </button>
        </div>

        {/* Vote */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Vote on Proposal</h2>
          <p className="mt-1 text-sm text-zinc-500">Vote for or against an active proposal</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-500">Proposal ID</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={voteProposalId}
                onChange={(e) => setVoteProposalId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setVoteSupport(true)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  voteSupport
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                Vote For
              </button>
              <button
                onClick={() => setVoteSupport(false)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  !voteSupport
                    ? "bg-red-600 text-white"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                Vote Against
              </button>
            </div>
          </div>

          <button
            onClick={handleVote}
            disabled={!voteProposalId || isPending || isConfirming}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending || isConfirming ? "Voting..." : "Submit Vote"}
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">All Proposals</h2>
        {count === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <span className="text-5xl">🏛️</span>
            <h3 className="mt-4 text-lg font-semibold text-white">No Proposals Yet</h3>
            <p className="mt-2 text-sm text-zinc-500">Be the first to create a governance proposal.</p>
          </div>
        ) : (
          <ProposalList ids={proposalIds} addrs={addrs} />
        )}
      </div>
    </div>
  );
}

function ProposalList({ ids, addrs }: { ids: number[]; addrs: any }) {
  return (
    <div className="grid gap-4">
      {ids.map((id) => (
        <ProposalCard key={id} id={id} addrs={addrs} />
      ))}
    </div>
  );
}

function ProposalCard({ id, addrs }: { id: number; addrs: any }) {
  const { data: proposal } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "proposals",
    args: [BigInt(id)],
    query: { enabled: !!addrs?.governance },
  });

  const { data: state } = useReadContract({
    address: addrs?.governance,
    abi: GOVERNANCE_ABI,
    functionName: "getProposalState",
    args: [BigInt(id)],
    query: { enabled: !!addrs?.governance },
  });

  if (!proposal) return null;

  const proposer = proposal[1] as string;
  const description = proposal[2] as string;
  const forVotes = proposal[3] as bigint;
  const againstVotes = proposal[4] as bigint;
  const executed = proposal[7] as boolean;
  const canceled = proposal[8] as boolean;

  const stateColors: Record<string, string> = {
    Active: "bg-emerald-900/50 text-emerald-400",
    Succeeded: "bg-blue-900/50 text-blue-400",
    Executed: "bg-zinc-800 text-zinc-400",
    Defeated: "bg-red-900/50 text-red-400",
    Canceled: "bg-zinc-800 text-zinc-500",
    Pending: "bg-amber-900/50 text-amber-400",
  };

  const stateStr = (state as string) || "Unknown";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-500">#{id}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${stateColors[stateStr] || "bg-zinc-800 text-zinc-400"}`}>
              {stateStr}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-300">{description}</p>
          <p className="mt-2 text-xs text-zinc-600">
            Proposed by {proposer?.slice(0, 6)}...{proposer?.slice(-4)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <div>
          <p className="text-xs text-zinc-500">For</p>
          <p className="text-sm font-semibold text-emerald-400">{formatEther(forVotes)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Against</p>
          <p className="text-sm font-semibold text-red-400">{formatEther(againstVotes)}</p>
        </div>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${Number(forVotes + againstVotes) > 0
                  ? (Number(forVotes) / Number(forVotes + againstVotes)) * 100
                  : 50}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
