import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

export async function POST(request: NextRequest) {
  try {
    // /api/users/:id/interests
    const parts = request.nextUrl.pathname.split("/");
    const userId = parts[3];

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body?.interests || !Array.isArray(body.interests)) {
      return NextResponse.json(
        { error: "Interests array is required" },
        { status: 400 }
      );
    }

    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // ✅ THE REAL BACKEND ENDPOINT:
    const forwardUrl = `${BACKEND_URL}/api/interests/${userId}/interests`;

    const backendResponse = await fetch(forwardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await backendResponse.text();

    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to save interests. Please try again.",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
