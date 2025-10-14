import { NextRequest, NextResponse } from "next/server";

// Pick backend base URL depending on env
const getBackendBase = (): string => {
  // Always use the Fly.io backend URL
  const backendUrl = "https://demedia-backend.fly.dev";
  console.log("Backend URL:", backendUrl);
  return backendUrl;
};

export const dynamic = "force-dynamic";

// Helper: resolve context.params (supports both Promise & object)
async function resolveParams(context: any): Promise<string[]> {
  if (!context) return [];
  const maybeParams = context.params;
  const resolved =
    typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;
  return (resolved?.path ?? []) as string[];
}

// Handlers
export const GET = async (req: NextRequest, context: any) => {
  const path = await resolveParams(context);
  return proxy(req, path);
};
export const POST = async (req: NextRequest, context: any) => {
  const path = await resolveParams(context);
  return proxy(req, path);
};
export const PUT = async (req: NextRequest, context: any) => {
  const path = await resolveParams(context);
  return proxy(req, path);
};
export const PATCH = async (req: NextRequest, context: any) => {
  const path = await resolveParams(context);
  return proxy(req, path);
};
export const DELETE = async (req: NextRequest, context: any) => {
  const path = await resolveParams(context);
  return proxy(req, path);
};

// Core proxy function
async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const backendBase = getBackendBase();
  if (!backendBase) {
    return NextResponse.json(
      { error: "Backend URL not configured" },
      { status: 502 }
    );
  }

  const targetUrl = joinUrl(
    backendBase,
    "/api/" + (path.length > 0 ? path.join("/") : "")
  );

  const headers = new Headers(req.headers);
  try {
    headers.set("host", new URL(backendBase).host);
  } catch {
    /* ignore */
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
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    init.signal = controller.signal;
    
    console.log(`🔄 Proxying ${req.method} request to: ${targetUrl}`);
    
    const res = await fetch(targetUrl, init);
    clearTimeout(timeoutId);
    
    console.log(`✅ Backend response: ${res.status} ${res.statusText}`);
    
    const resHeaders = new Headers(res.headers);
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("connection");

    // Use Response directly for streaming compatibility
    return new Response(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Backend request failed: ${message}`);
    
    // Handle timeout specifically
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout - Backend took too long to respond", details: "Please try again" },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: "Upstream fetch failed", details: message },
      { status: 502 }
    );
  }
}

// Join base + path safely
function joinUrl(base: string, path: string): string {
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base + path;
}
