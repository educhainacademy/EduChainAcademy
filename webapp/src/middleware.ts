import { NextResponse, type NextRequest } from "next/server";
import restrictedJurisdictions from "../../../compliance/restricted-jurisdictions.json";

interface GeoFenceResult {
  allowed: boolean;
  jurisdiction: string;
  category: string;
  reason?: string;
}

const IP_GEO_SERVICE_URL = process.env.IP_GEO_SERVICE_URL || "http://ip-api.com/json";
const GEO_FENCING_ENABLED = process.env.GEO_FENCING_ENABLED === "true";

function getJurisdictionCategory(code: string): { category: string; reason?: string } {
  const { categories } = restrictedJurisdictions;

  for (const [cat, data] of Object.entries(categories)) {
    const jurisdiction = (data as any).jurisdictions.find((j: any) => j.code === code);
    if (jurisdiction) {
      return { category: cat, reason: jurisdiction.reason };
    }
  }

  return { category: "compliant" };
}

async function lookupJurisdiction(ip: string): Promise<string> {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) {
    return "US"; // default for local dev
  }

  try {
    const res = await fetch(`${IP_GEO_SERVICE_URL}/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data.countryCode || "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

export async function geoFence(request: NextRequest): Promise<GeoFenceResult> {
  if (!GEO_FENCING_ENABLED) {
    return { allowed: true, jurisdiction: "BYPASS", category: "compliant" };
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";

  const jurisdictionCode = await lookupJurisdiction(ip);
  const { category, reason } = getJurisdictionCategory(jurisdictionCode);

  if (category === "fullyBlocked") {
    return {
      allowed: false,
      jurisdiction: jurisdictionCode,
      category,
      reason: reason || "Access restricted in your jurisdiction",
    };
  }

  return {
    allowed: true,
    jurisdiction: jurisdictionCode,
    category,
  };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const geoHeader = request.headers.get("x-vercel-ip-country");
  if (geoHeader) {
    const { category, reason } = getJurisdictionCategory(geoHeader);
    response.headers.set("x-edu-geo-category", category);
    if (reason) {
      response.headers.set("x-edu-geo-reason", reason);
    }
    if (category === "fullyBlocked") {
      return NextResponse.json(
        { error: "Access restricted", message: reason || "Not available in your jurisdiction" },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
