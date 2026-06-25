import { NextRequest, NextResponse } from "next/server";

const VERIFIER_PRIVATE_KEY = process.env.QUEST_VERIFIER_PRIVATE_KEY || "";

export async function POST(request: NextRequest) {
  if (!VERIFIER_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "Server not configured for signing" },
      { status: 503 }
    );
  }

  try {
    const { player, questId, deadline } = await request.json();

    if (!player || questId === undefined || !deadline) {
      return NextResponse.json(
        { error: "Missing player, questId, or deadline" },
        { status: 400 }
      );
    }

    // Import ethers for signing
    const { ethers } = await import("ethers");
    const wallet = new ethers.Wallet(VERIFIER_PRIVATE_KEY);

    // Sign the same digest the contract expects
    const digest = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256"],
      [player, questId, deadline]
    );

    const signingKey = new ethers.SigningKey(VERIFIER_PRIVATE_KEY);
    const sig = signingKey.sign(digest);
    const signature = ethers.concat([sig.r, sig.s, ethers.toBeHex(sig.v, 1)]);

    return NextResponse.json({
      signature,
      deadline,
      verifier: wallet.address,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
