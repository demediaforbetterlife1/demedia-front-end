// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_BASE = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

// ✅ حل شامل: دعم كل حالات params (Promise أو object أو undefined)
async function resolveParams(context: any): Promise<string[]> {
  try {
    const maybeParams = await context?.params;
    if (!maybeParams) return [];
    if (Array.isArray(maybeParams.path)) return maybeParams.path;
    if (typeof maybeParams.path === "string") return [maybeParams.path];
    return [];
  } catch {
    return [];
  }
}

async function handler(req: NextRequest, context: any): Promise<Response> {
  const pathSegments = await resolveParams(context);
  return proxyRequest(req, pathSegments);
}

async function proxyRequest(req: NextRequest, pathSegments: string[]): Promise<Response> {
  // ✅ تأكد من دمج المسار صح
  const targetUrl = `${BACKEND_BASE}/api/${pathSegments.join("/")}`.replace(/\/+$/, "");
  console.log("🔗 Proxy →", targetUrl);
  console.log("📋 Method:", req.method);
  console.log("📋 Headers:", Object.fromEntries(req.headers.entries()));

  const headers = new Headers(req.headers);
  if (headers.has("host")) headers.delete("host");

  // Forward cookies explicitly - FIXED: Remove duplicate cookie declarations
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
    console.log("🍪 Forwarding cookies:", cookieHeader);
  }

  // Also forward Authorization header if present (for token fallback)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
    console.log("🔑 Forwarding auth header");
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;
    console.log("📦 Body size:", body.byteLength, "bytes");
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    init.signal = controller.signal;

    console.log("⏳ Sending request to backend...");
    const res = await fetch(targetUrl, init);
    clearTimeout(timeout);

    console.log(`✅ ${req.method} → ${res.status} (${targetUrl})`);

    // Log error response body for debugging
    if (!res.ok) {
      try {
        const errorBody = await res.clone().text();
        console.error(`❌ Backend error response (${res.status}):`, errorBody);
        
        // Return more detailed error to frontend
        return NextResponse.json({ 
          error: "Backend error", 
          status: res.status,
          details: errorBody,
          message: `Backend returned ${res.status}. Check backend logs for details.`
        }, { status: res.status });
      } catch (e) {
        console.error(`❌ Failed to read error response body:`, e);
      }
    }

    const resHeaders = new Headers(res.headers);
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("connection");

    return new Response(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error("❌ Proxy error:", err);
    console.error("❌ Error details:", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack
    });

    if (err?.name === "AbortError") {
      return NextResponse.json({ 
        error: "Timeout", 
        details: "Backend took too long to respond (>30s)",
        message: "The backend server is not responding. Please try again later."
      }, { status: 504 });
    }

    return NextResponse.json({ 
      error: "Proxy failed", 
      details: err?.message || String(err),
      message: "Failed to connect to backend server. Please check if backend is running."
    }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;