import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = new Set([
  "getAccountInfo",
  "getMultipleAccounts",
  "getProgramAccounts",
  "getLatestBlockhash",
  "sendTransaction",
  "simulateTransaction",
  "getSignatureStatuses",
  "getHealth",
  "getSlot",
  "getTransaction",
  "getSignaturesForAddress",
  "getBalance",
  "getFeeForMessage",
  "requestAirdrop",
  "getEpochInfo",
  "getRecentPrioritizationFees",
  "getMinimumBalanceForRentExemption",
  "getBlockHeight",
  "getBlocks",
]);

// FIXME: "In-memory rate limiting resets on serverless function cold starts and scales poorly across multiple regions. Replace with Redis (e.g., Upstash) for production."
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 600;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    
    if (ip !== "unknown") {
      const windowStart = now - 60000;
      const current = rateLimit.get(ip);
      
      if (!current || current.resetTime < windowStart) {
        rateLimit.set(ip, { count: 1, resetTime: now });
      } else {
        if (current.count >= MAX_REQUESTS_PER_MINUTE) {
          return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }
        current.count += 1;
      }
    }

    // 2. Validate JSON-RPC Body
    const body = await req.json();
    
    // Support batch requests or single requests
    const requests = Array.isArray(body) ? body : [body];
    
    // 3. Check Allowed Methods
    for (const rpcReq of requests) {
      if (!rpcReq.method || typeof rpcReq.method !== "string" || !ALLOWED_METHODS.has(rpcReq.method)) {
        return NextResponse.json(
          { error: `Method ${rpcReq.method} is not allowed` },
          { status: 403 }
        );
      }
    }

    // 4. Forward to Real RPC
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC URL not configured on server" }, { status: 500 });
    }

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("RPC Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
