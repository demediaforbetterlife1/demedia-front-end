import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/backend";

export async function POST(request: NextRequest, context: any) {
  const postId = context.params.id;

  try {
    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get('token')?.value;
    let authHeader = request.headers.get("authorization");
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Extract user ID from token if not provided in headers
    let userId = request.headers.get("user-id");
    if (!userId) {
      try {
        const part = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(part, 'base64').toString('utf-8'));
        userId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
      } catch (_) {}
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 401 }
      );
    }

    console.log("Like request for post:", postId, "user:", userId);

    try {
      const backendResponse = await fetch(
        `${BACKEND_URL}/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Cookie": `token=${token}`, // Forward cookie for backend auth
            "user-id": userId,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log("✅ Like updated via backend:", data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error(
          "❌ Backend like failed:",
          backendResponse.status,
          errorText
        );
        // Return error instead of fallback
        return NextResponse.json(
          { error: "Backend unavailable", status: backendResponse.status },
          { status: 503 }
        );
      }
    } catch (backendError) {
      console.error("❌ Backend connection failed:", backendError);
      // Return error instead of fallback
      return NextResponse.json(
        { error: "Backend unavailable" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error handling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}