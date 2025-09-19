import { NextRequest, NextResponse } from "next/server";

// Proxy all /api/* requests from Next to the real backend,
// so the frontend can always call same-origin "/api/...".

const getBackendBase = (): string => {
    const isProd = process.env.NODE_ENV === "production";
    const envUrl = process.env.BACKEND_URL?.trim();
    if (isProd) {
        // في البروडकشن لازم BACKEND_URL يتحدد
        return envUrl || "";
    }
    // في التطوير
    return envUrl || "http://localhost:5000";
};

export const dynamic = "force-dynamic";

// REST handlers
export async function GET(req: NextRequest, context: { params: { path: string[] } }) {
    return proxy(req, context.params);
}
export async function POST(req: NextRequest, context: { params: { path: string[] } }) {
    return proxy(req, context.params);
}
export async function PUT(req: NextRequest, context: { params: { path: string[] } }) {
    return proxy(req, context.params);
}
export async function PATCH(req: NextRequest, context: { params: { path: string[] } }) {
    return proxy(req, context.params);
}
export async function DELETE(req: NextRequest, context: { params: { path: string[] } }) {
    return proxy(req, context.params);
}

// Proxy function
async function proxy(
    req: NextRequest,
    { path }: { path: string[] }
): Promise<NextResponse> {
    const backendBase = getBackendBase();
    if (!backendBase) {
        return NextResponse.json(
            { error: "Backend URL not configured" },
            { status: 502 }
        );
    }

    const targetUrl = joinUrl(backendBase, "/api/" + (path.length > 0 ? path.join("/") : ""));

    const headers = new Headers(req.headers);
    headers.set("host", new URL(backendBase).host);

    const init: RequestInit = {
        method: req.method,
        headers,
        redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
        const body = await req.arrayBuffer();
        init.body = body; // ✅ بدون any
    }

    try {
        const res = await fetch(targetUrl, init);
        const resHeaders = new Headers(res.headers);

        // Strip hop-by-hop headers
        resHeaders.delete("transfer-encoding");
        resHeaders.delete("connection");

        const responseBody = res.body ?? undefined;
        return new NextResponse(responseBody, {
            status: res.status,
            headers: resHeaders,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
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
