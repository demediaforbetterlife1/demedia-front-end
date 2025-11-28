import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // لو الصور أو الفيديوهات كبيرة
    },
  },
};

// ✅ جلب كل البوستات
export async function GET(request: NextRequest) {
  try {
    const backendUrl =
      (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
      "/api/posts";
    const userId = request.headers.get("user-id");

    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get("token")?.value;

    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    const headers: HeadersInit = {};
    if (userId) headers["user-id"] = userId;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["Cookie"] = `token=${token}`; // Forward cookie for backend auth
    }

    const res = await fetch(backendUrl, {
      cache: "no-store", // مهم جدًا علشان يمنع التخزين المؤقت
      headers,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("❌ Backend returned error:", text);
      return NextResponse.json(
        { error: true, message: "Backend returned error", status: res.status },
        { status: res.status },
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Posts fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: true, message: errorMessage },
      { status: 500 },
    );
  }
}

// ✅ إنشاء بوست جديد
export async function POST(request: NextRequest) {
  try {
    const backendUrl =
      (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
      "/api/posts";
    const body = await request.json();
    const userId = request.headers.get("user-id");

    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get("token")?.value;

    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token || !userId) {
      return NextResponse.json(
        { error: true, message: "Authentication required" },
        { status: 401 },
      );
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "user-id": userId,
      Authorization: `Bearer ${token}`,
      Cookie: `token=${token}`, // Forward cookie for backend auth
    };

    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("❌ Backend returned error:", text);

      // Provide specific error messages based on status code
      let errorMessage = "Failed to create post";
      let details = text;

      switch (res.status) {
        case 401:
          errorMessage = "Authentication failed. Please log in again.";
          details = "Your session may have expired";
          break;
        case 413:
          errorMessage = "File too large. Please choose a smaller image.";
          details = "Maximum file size is 10MB";
          break;
        case 400:
          errorMessage = "Invalid post data. Please check your content.";
          break;
        case 429:
          errorMessage = "Too many posts. Please wait before posting again.";
          break;
        case 500:
          errorMessage = "Server error. Please try again later.";
          break;
        default:
          errorMessage = `Post creation failed (${res.status})`;
      }

      return NextResponse.json(
        {
          error: true,
          message: errorMessage,
          details: details,
          status: res.status,
        },
        { status: res.status },
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ Post creation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: true, message: errorMessage },
      { status: 500 },
    );
  }
}
