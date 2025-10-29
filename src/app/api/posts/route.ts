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
    const backendUrl = "https://demedia-backend.fly.dev/api/posts";
    const userId = request.headers.get("user-id");
    const authHeader = request.headers.get("authorization");

    const headers: HeadersInit = {};
    if (userId) headers["user-id"] = userId;
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(backendUrl, {
      cache: "no-store", // مهم جدًا علشان يمنع التخزين المؤقت
      headers,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("❌ Backend returned error:", text);
      return NextResponse.json(
        { error: true, message: "Backend returned error", status: res.status },
        { status: res.status }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("❌ Posts fetch error:", error);
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// ✅ إنشاء بوست جديد
export async function POST(request: NextRequest) {
  try {
    const backendUrl = "https://demedia-backend.fly.dev/api/posts";
    const body = await request.json();
    const userId = request.headers.get("user-id");
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: true, message: "Authentication required" },
        { status: 401 }
      );
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "user-id": userId,
      Authorization: authHeader,
    };

    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("❌ Backend returned error:", text);
      return NextResponse.json(
        { error: true, message: "Backend returned error", status: res.status },
        { status: res.status }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("❌ Post creation error:", error);
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}