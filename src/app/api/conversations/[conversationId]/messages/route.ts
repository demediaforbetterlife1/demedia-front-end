import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://demedia-backend.fly.dev";

const buildAuthHeaders = (request: NextRequest) => {
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const userId = request.headers.get("user-id");

  if (!token) {
    return null;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (userId) {
    headers["user-id"] = userId;
  }

  return headers;
};

async function proxyRequest(
  request: NextRequest,
  conversationId: string,
  init?: RequestInit
) {
  const headers = buildAuthHeaders(request);

  if (!headers) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/conversations/${conversationId}/messages`,
      {
        ...init,
        headers,
        cache: "no-store",
      }
    );

    const text = await backendResponse.text();

    if (!backendResponse.ok) {
      console.warn(
        "[conversation messages] Backend responded with",
        backendResponse.status,
        text
      );

      if (backendResponse.status === 404) {
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json(
        { error: text || "Failed to fetch messages" },
        { status: backendResponse.status }
      );
    }

    try {
      const data = text ? JSON.parse(text) : [];
      return NextResponse.json(data, { status: 200 });
    } catch (parseError) {
      console.error(
        "[conversation messages] Failed to parse backend response:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid response from backend" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.warn(
      "[conversation messages] Backend unavailable, returning empty list:",
      error
    );
    return NextResponse.json([], { status: 200 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json(
      { error: "Missing conversationId" },
      { status: 400 }
    );
  }

  return proxyRequest(request, conversationId);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json(
      { error: "Missing conversationId" },
      { status: 400 }
    );
  }

  const body = await request.text();

  return proxyRequest(request, conversationId, {
    method: "POST",
    body,
  });
}

