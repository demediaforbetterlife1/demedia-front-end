import { NextResponse } from "next/server";

const BACKEND_URL = "https://demedia-backend.fly.dev/api/posts";

// ✅ GET → جلب كل البوستات
export async function GET() {
  try {
    const res = await fetch(BACKEND_URL, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch posts. Please try again." },
      { status: 500 }
    );
  }
}

// ✅ POST → إنشاء بوست جديد
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // نطبع الـ body على الصفحة لو فيه مشكلة
    const debugInfo = {
      sentBody: body,
    };

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
      return NextResponse.json(
        {
          error: `❌ Failed to create post (${res.status})`,
          backendResponse: text,
          sentBody: debugInfo.sentBody,
        },
        { status: res.status }
      );
    }

    const newPost = JSON.parse(text);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 }
    );
  }
}