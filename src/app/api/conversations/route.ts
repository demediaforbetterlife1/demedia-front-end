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

export async function GET(request: NextRequest) {
  try {
    const headers = buildAuthHeaders(request);

    if (!headers) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/conversations`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const text = await backendResponse.text();

      if (!backendResponse.ok) {
        console.warn(
          "[conversations] Backend responded with",
          backendResponse.status,
          text
        );

        if (backendResponse.status === 404) {
          return NextResponse.json([], { status: 200 });
        }

        return NextResponse.json(
          { error: text || "Failed to fetch conversations" },
          { status: backendResponse.status }
        );
      }

      const data = text ? JSON.parse(text) : [];
      return NextResponse.json(
        Array.isArray(data) ? data : [],
        { status: 200 }
      );
    } catch (backendError) {
      console.warn(
        "[conversations] Backend unavailable, returning empty list:",
        backendError
      );
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("[conversations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

