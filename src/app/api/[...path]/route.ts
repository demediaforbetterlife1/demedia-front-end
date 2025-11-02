import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // استخدم "edge" لو عايز سرعة أعلى ومفيش socket

const BACKEND_BASE = "https://demedia-backend.fly.dev";

// Resolve params safely (يدعم Promise و Object)
async function resolveParams(context: any): Promise<string[]> {
  if (!context) return [];
  const maybeParams = context.params;
  const resolved =
    typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;
  return (resolved?.path ?? []) as string[];
}

// Unified handler (لكل الميثودات)
async function handler(req: NextRequest, context: any): Promise<Response> {
  const path = await resolveParams(context);
  return proxyRequest(req, path);
}

// Proxy logic (الجزء الأساسي)
async function proxyRequest(req: NextRequest, path: string[]): Promise<Response> {
  const targetUrl = joinUrl(
    BACKEND_BASE,
    "/api/" + (path.length > 0 ? path.join("/") : "")
  );

  const headers = new Headers(req.headers);
  // بعض السيرفرات بترفض الـ "host" header فبنحذفه
  if (headers.has("host")) headers.delete("host");

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
    // Timeout 30 ثانية علشان الطلب ما يعلقش
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    init.signal = controller.signal;

    console.log(`🔄 Proxying ${req.method} → ${targetUrl}`);

    const res = await fetch(targetUrl, init);
    clearTimeout(timeout);

    console.log(`✅ Response ${res.status} ${res.statusText}`);

    const resHeaders = new Headers(res.headers);
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("connection");

    return new Response(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`❌ Proxy error: ${err?.message || err}`);

    if (err?.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Request timeout",
          details: "Backend took too long to respond",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: "Proxy failed",
        details: err?.message || String(err),
      },
      { status: 502 }
    );
  }
}

// Join base + path safely
function joinUrl(base: string, path: string): string {
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base + path;
}

// Exports for Next.js handlers
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;