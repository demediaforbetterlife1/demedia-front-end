import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 Auth/me: GET request received");

    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get("token")?.value;

    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    console.log("🔑 Auth/me: Token exists:", !!token);

    if (!token) {
      console.log("❌ Auth/me: No token provided");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const backendUrl = (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") + "/api/auth/me";
    
    console.log("🌐 Auth/me: Backend URL:", backendUrl);

    const headers: HeadersInit = {
      "Authorization": `Bearer ${token}`,
      "Cookie": `token=${token}`,
      "Content-Type": "application/json",
    };

    console.log("📤 Auth/me: Making request to backend...");

    const res = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    console.log("📡 Auth/me: Backend response status:", res.status);

    const text = await res.text();
    console.log("📦 Auth/me: Backend response text (first 200 chars):", text.substring(0, 200));

    if (!res.ok) {
      console.error("❌ Auth/me: Backend returned error:", res.status, text);
      
      if (res.status === 401) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: res.status }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Auth/me: Failed to parse JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid response from backend" },
        { status: 500 }
      );
    }

    console.log("✅ Auth/me: User data fetched successfully:", data.user ? `ID: ${data.user.id}` : 'No user');

    return NextResponse.json(data, { status: 200 });

  } catch (error: unknown) {
    console.error("❌ Auth/me: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}