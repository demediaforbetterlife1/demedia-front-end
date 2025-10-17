import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // ✅ التحقق من وجود Authorization Header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // ✅ استخراج الـ userId من الـ JWT
    let currentUserId: string | null = null;
    try {
      const token = authHeader.replace("Bearer ", "");
      const part = token.split(".")[1];
      const decoded = JSON.parse(Buffer.from(part, "base64").toString("utf-8"));
      currentUserId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
    } catch (_) {
      // لو حصل خطأ في فك التشفير مش مشكلة
    }

    // ✅ استدعاء الـ Backend API
    const backendResponse = await fetch(
      `https://demedia-backend.fly.dev/api/users/${userId}/profile`,
      {
        headers: {
          Authorization: authHeader,
          "user-id": currentUserId || request.headers.get("user-id") || "",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    // ✅ معالجة الرد من الباك اند
    if (backendResponse.ok) {
      const data = await backendResponse.json();

      // ✅ تعديل روابط الصور لتكون كاملة
      if (data.profilePicture && typeof data.profilePicture === "string" && !data.profilePicture.startsWith("http")) {
        data.profilePicture = `https://demedia-backend.fly.dev${data.profilePicture}`;
      }
      if (data.coverPhoto && typeof data.coverPhoto === "string" && !data.coverPhoto.startsWith("http")) {
        data.coverPhoto = `https://demedia-backend.fly.dev${data.coverPhoto}`;
      }

      return NextResponse.json(data);
    }

    // ✅ في حالة فشل الاستجابة من الباك اند
    const text = await backendResponse.text();
    return NextResponse.json(
      { error: text || "Failed to fetch profile" },
      { status: backendResponse.status }
    );
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
