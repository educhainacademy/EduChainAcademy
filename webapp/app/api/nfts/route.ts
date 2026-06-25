import { NextRequest, NextResponse } from "next/server";
import { getNFTsForOwner, getNFTMetadata } from "@/lib/alchemy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const contractAddress = searchParams.get("contractAddress");
  const tokenId = searchParams.get("tokenId");

  if (contractAddress && tokenId) {
    const nft = await getNFTMetadata(contractAddress, tokenId);
    return NextResponse.json({ nft });
  }

  if (!owner) {
    return NextResponse.json({ error: "Missing owner or contractAddress+tokenId" }, { status: 400 });
  }

  const contractsParam = searchParams.get("contracts");
  const contracts = contractsParam ? contractsParam.split(",") : undefined;

  const nfts = await getNFTsForOwner(owner, contracts);
  return NextResponse.json({ nfts });
}
