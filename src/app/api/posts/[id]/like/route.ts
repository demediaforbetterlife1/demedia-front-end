import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;
    const authHeader = request.headers.get("authorization");
    const userId = request.headers.get("user-id");

    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("📩 Like request for post:", postId, "by user:", userId);

    // ✅ الاتصال المباشر بالباك اند الحقيقي
    const backendResponse = await fetch(
      `https://demedia-backend.fly.dev/api/posts/${postId}/like`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        "❌ Backend like failed:",
        backendResponse.status,
        errorText
      );
      return NextResponse.json(
        { error: "Failed to update like on backend" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log("✅ Like updated successfully:", data);

    // رجّع النتيجة من الباك اند نفسه
    return NextResponse.json(data);
  } catch (error) {
    console.error("🔥 Error handling like request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}