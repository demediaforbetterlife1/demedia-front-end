import { NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://demedia-backend.fly.dev";

// ✅ GET → جلب كل البوستات من الباك إند
export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching posts:", error.message);
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

    // التحقق من البيانات قبل الإرسال
    if (!body || !body.userId || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields (userId or content)." },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": String(body.userId),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to create post: ${text}`);
    }

    const newPost = await response.json();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating post:", error.message);
    return NextResponse.json(
      { error: "Failed to create post. Please try again." },
      { status: 500 }
    );
  }
}