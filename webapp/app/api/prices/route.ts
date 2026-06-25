import { NextRequest, NextResponse } from "next/server";
import { getTokenPrices } from "@/lib/alchemy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.getAll("symbols");

  if (symbols.length === 0) {
    return NextResponse.json({ error: "Missing symbols param" }, { status: 400 });
  }

  const prices = await getTokenPrices(symbols);
  return NextResponse.json({ prices });
}
