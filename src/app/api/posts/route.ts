import { NextResponse } from "next/server";

const BACKEND_URL = "https://demedia-backend.fly.dev/api/posts";

// GET → جلب كل البوستات من الباك إند
export async function GET() {
  try {
    const res = await fetch(BACKEND_URL, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching posts:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST → إنشاء بوست جديد
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": String(body.userId),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create post: ${text}`);
    }

    const newPost = await res.json();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error("Error creating post:", error.message);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}