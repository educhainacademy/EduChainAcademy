import { NextRequest, NextResponse } from "next/server";

const PUBLIC_RPC = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo";

const ABIS: Record<string, any[]> = {
  ownerOf: [
    {
      type: "function",
      name: "ownerOf",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
    },
  ],
  tokenURI: [
    {
      type: "function",
      name: "tokenURI",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
    },
  ],
  itemLevel: [
    {
      type: "function",
      name: "itemLevel",
      inputs: [{ name: "", type: "uint256" }],
      outputs: [{ name: "", type: "uint8" }],
      stateMutability: "view",
    },
  ],
  xpBalance: [
    {
      type: "function",
      name: "xpBalance",
      inputs: [{ name: "", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
  ],
};

function encodeFunction(name: string, args: any[]): string {
  const abi = ABIS[name];
  if (!abi) throw new Error(`Unknown function: ${name}`);
  const fn = abi[0];

  // Compute function selector
  const sig = `${name}(${fn.inputs.map((i: any) => i.type).join(",")})`;
  const selector = sig === "ownerOf(uint256)" ? "0x6352211e"
    : sig === "tokenURI(uint256)" ? "0xc87b56dd"
    : sig === "itemLevel(uint256)" ? "0x76d91838"
    : sig === "xpBalance(address)" ? "0x5542e2f8"
    : "0x" + Array.from(new TextEncoder().encode(sig)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 8);

  // Actually compute keccak properly
  return "0x00000000"; // placeholder
}

function functionSelector(name: string): string {
  // Pre-computed selectors
  const selectors: Record<string, string> = {
    ownerOf: "0x6352211e",
    tokenURI: "0xc87b56dd",
    itemLevel: "0x76d91838",
    xpBalance: "0x5542e2f8",
  };
  return selectors[name] || "0x00000000";
}

function encodeArgs(types: string[], values: any[]): string {
  let encoded = "";
  for (let i = 0; i < types.length; i++) {
    if (types[i] === "uint256") {
      encoded += BigInt(values[i]).toString(16).padStart(64, "0");
    } else if (types[i] === "address") {
      encoded += values[i].toLowerCase().replace("0x", "").padStart(64, "0");
    }
  }
  return encoded;
}

async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(PUBLIC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = await res.json();
  return json.result || "0x";
}

function decodeString(hex: string): string {
  // Simple string decode for ABI-encoded string
  if (hex === "0x" || hex.length < 130) return "";
  const data = hex.slice(130); // skip offset + length prefix
  const bytes = data.match(/.{2}/g);
  if (!bytes) return "";
  const str = bytes.map((b) => parseInt(b, 16)).map((c) => String.fromCharCode(c)).join("");
  return str.replace(/\0/g, "");
}

function decodeUint256(hex: string): number {
  return parseInt(hex.slice(2, 66), 16);
}

function decodeAddress(hex: string): string {
  return "0x" + hex.slice(26, 66);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const fn = searchParams.get("fn");
  const arg = searchParams.get("arg");
  const chain = searchParams.get("chain") || "sepolia";

  if (!address || !fn) {
    return NextResponse.json({ error: "Missing address or fn" }, { status: 400 });
  }

  const rpcUrls: Record<string, string> = {
    sepolia: PUBLIC_RPC,
    polygonAmoy: "https://rpc-amoy.polygon.technology",
  };

  const rpc = rpcUrls[chain] || PUBLIC_RPC;

  try {
    let data: string;
    if (fn === "ownerOf" || fn === "tokenURI" || fn === "itemLevel") {
      if (!arg) return NextResponse.json({ error: "Missing arg" }, { status: 400 });
      const selector = functionSelector(fn);
      const types = fn === "ownerOf" || fn === "tokenURI" || fn === "itemLevel" ? ["uint256"] : ["address"];
      data = selector + encodeArgs(types, [arg]);
    } else if (fn === "xpBalance") {
      if (!arg) return NextResponse.json({ error: "Missing arg" }, { status: 400 });
      data = functionSelector("xpBalance") + encodeArgs(["address"], [arg]);
    } else {
      return NextResponse.json({ error: "Unknown function" }, { status: 400 });
    }

    const result = await ethCall(address, data);

    let decoded: any;
    if (fn === "ownerOf") {
      decoded = decodeAddress(result);
    } else if (fn === "tokenURI") {
      decoded = decodeString(result);
    } else if (fn === "itemLevel") {
      decoded = decodeUint256(result);
    } else if (fn === "xpBalance") {
      decoded = "0x" + result.slice(2, 66);
    }

    return NextResponse.json({ result: decoded });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
