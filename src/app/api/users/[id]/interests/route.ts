import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

export async function POST(request: NextRequest) {
  try {
    // ✅ Get userId from URL: /api/users/:id/interests
    const pathname = request.nextUrl.pathname;
    const parts = pathname.split("/"); // ["", "api", "users", ":id", "interests"]
    const userId = parts[3];

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // ✅ Parse body safely
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

    // ✅ Extract token
    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // ✅ Forward to backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/users/${userId}/interests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    // ✅ Read response safely (handles HTML / empty / non-JSON)
    const raw = await backendResponse.text();

    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    // If backend returned 204 (empty)
    if (!raw && backendResponse.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to save interests. Please try again.",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
