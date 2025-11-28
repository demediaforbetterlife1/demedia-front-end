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
  console.log("📡 Posts API: GET request received");

  try {
    const backendUrl =
      (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
      "/api/posts";
    const userId = request.headers.get("user-id");

    console.log("🌐 Backend URL:", backendUrl);
    console.log("👤 User ID:", userId);

    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get("token")?.value;

    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    console.log("🔑 Token exists:", !!token);

    const headers: HeadersInit = {};
    if (userId) headers["user-id"] = userId;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["Cookie"] = `token=${token}`; // Forward cookie for backend auth
    }

    console.log("📤 Making request to backend...");

    try {
      const res = await fetch(backendUrl, {
        cache: "no-store", // مهم جدًا علشان يمنع التخزين المؤقت
        headers,
      });

      console.log("📡 Backend response status:", res.status);

      const text = await res.text();
      console.log(
        "📦 Backend response text (first 200 chars):",
        text.substring(0, 200),
      );

      if (!res.ok) {
        console.error("❌ Backend returned error:", res.status, text);

        // Return mock data for testing when backend is down
        const mockPosts = [
          {
            id: 1,
            title: "Test Post 1",
            content: "This is a test post when backend is unavailable",
            imageUrl: null,
            imageUrls: [],
            videoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: {
              id: 1,
              username: "testuser",
              name: "Test User",
              profilePicture: null,
            },
          },
          {
            id: 2,
            title: "Test Post 2",
            content: "Another test post",
            imageUrl: null,
            imageUrls: [],
            videoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: {
              id: 2,
              username: "testuser2",
              name: "Test User 2",
              profilePicture: null,
            },
          },
        ];

        console.log("🔧 Returning mock data due to backend error");
        return NextResponse.json(
          { posts: mockPosts, isMockData: true },
          { status: 200 },
        );
      }

      const data = JSON.parse(text);
      console.log(
        "✅ Backend data parsed successfully, posts count:",
        data.posts?.length || data.length || 0,
      );
      return NextResponse.json(data, { status: 200 });
    } catch (fetchError) {
      console.error("🚨 Backend fetch failed:", fetchError);

      // Return mock data when backend is completely unreachable
      const mockPosts = [
        {
          id: 1,
          title: "Mock Post 1",
          content: "This is a mock post - backend unreachable",
          imageUrl: null,
          imageUrls: [],
          videoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: 1,
            username: "mockuser",
            name: "Mock User",
            profilePicture: null,
          },
        },
      ];

      console.log("🔧 Returning mock data due to fetch failure");
      return NextResponse.json(
        { posts: mockPosts, isMockData: true },
        { status: 200 },
      );
    }
  } catch (error: unknown) {
    console.error("❌ Posts API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Even if everything fails, return empty array instead of error
    console.log("🔧 Returning empty posts array due to complete failure");
    return NextResponse.json(
      { posts: [], error: true, message: errorMessage },
      { status: 200 },
    );
  }
}

// ✅ إنشاء بوست جديد
export async function POST(request: NextRequest) {
  try {
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

    const backendUrl =
      (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
      "/api/posts";

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
