// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_BASE = process.env.BACKEND_URL || "https://demedia-backend-production.up.railway.app";

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

  const headers = new Headers(req.headers);
  if (headers.has("host")) headers.delete("host");

  // Forward cookies explicitly - FIXED: Remove duplicate cookie declarations
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  // Also forward Authorization header if present (for token fallback)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    init.signal = controller.signal;

    const res = await fetch(targetUrl, init);
    clearTimeout(timeout);

    console.log(`✅ ${req.method} → ${res.status} (${targetUrl})`);

    // Log error response body for debugging
    if (!res.ok) {
      try {
        const errorBody = await res.clone().text();
        console.error(`❌ Backend error response (${res.status}):`, errorBody);
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

    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Timeout", details: "Backend took too long" }, { status: 504 });
    }

    return NextResponse.json({ error: "Proxy failed", details: err?.message || String(err) }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;