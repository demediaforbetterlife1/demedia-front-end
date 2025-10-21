import { NextResponse } from "next/server";

// ✅ GET → جلب كل البوستات
export async function GET() {
  try {
    const res = await fetch("https://demedia-backend.fly.dev/api/posts", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching posts:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch posts. Please try again." },
      { status: 500 }
    );
  }
}

// ✅ POST → إنشاء بوست جديد مع debug كامل
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || !body.content) {
      return NextResponse.json(
        { error: "Content field is required" },
        { status: 400 }
      );
    }

    const res = await fetch("https://demedia-backend.fly.dev/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": String(body.userId || ""),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let backendResponse;

    try {
      backendResponse = JSON.parse(text);
    } catch {
      backendResponse = text;
    }

    return NextResponse.json(
      {
        status: res.status,
        ok: res.ok,
        sentBody: body,
        backendResponse,
      },
      { status: res.status }
    );
  } catch (error: any) {
    console.error("Error creating post:", error.message);
    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 }
    );
  }
}