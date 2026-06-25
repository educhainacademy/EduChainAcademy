import { NextRequest, NextResponse } from "next/server";
import { getWalletPortfolio } from "@/lib/alchemy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const addresses = searchParams.getAll("addresses");

  if (addresses.length === 0) {
    return NextResponse.json({ error: "Missing addresses param" }, { status: 400 });
  }

  const portfolio = await getWalletPortfolio(addresses);
  return NextResponse.json({ portfolio });
}
