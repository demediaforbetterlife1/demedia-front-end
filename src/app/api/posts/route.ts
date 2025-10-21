import { NextResponse } from "next/server";

const BACKEND_URL = "https://demedia-backend.fly.dev/api/posts";

// 🟢 GET — جلب كل البوستات
export async function GET() {
  try {
    const res = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("❌ Backend GET error:", text);
      return NextResponse.json(
        { error: `Failed to fetch posts (${res.status})` },
        { status: res.status }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Invalid JSON from backend:", text);
      return NextResponse.json(
        { error: "Invalid response from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("🚨 Network error fetching posts:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch posts. Please try again." },
      { status: 500 }
    );
  }
}

// 🟡 POST — إنشاء بوست جديد
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": String(body.userId || ""),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("❌ Backend POST error:", text);
      return NextResponse.json(
        { error: `Failed to create post (${res.status})`, details: text },
        { status: res.status }
      );
    }

    let newPost;
    try {
      newPost = JSON.parse(text);
    } catch {
      console.error("❌ Invalid JSON response on POST:", text);
      return NextResponse.json(
        { error: "Invalid JSON from backend" },
        { status: 500 }
      );
    }

    // ✅ رجع البوست الجديد
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error("🚨 Network error creating post:", error.message);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}