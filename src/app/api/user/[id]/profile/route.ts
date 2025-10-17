// src/app/api/users/[id]/profile/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET: جلب بيانات البروفايل
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // <- النوع المطلوب
) => {
  try {
    const { id: userId } = await context.params; // فك الـ Promise
    const backendUrl = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

    const response = await fetch(`${backendUrl}/api/user/${userId}/profile`);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Failed to fetch user profile" },
        { status: response.status }
      );
    }

    const user = await response.json();
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

// PUT: تعديل بيانات البروفايل
export const PUT = async (
  request: NextRequest,
  context: { params: { id: string } } // <- النوع الصح حسب Next.js 15.5
) => {
  try {
    const { id: userId } = context.params; // مش Promise، مباشرة { id }
    const body = await request.json();

    const backendUrl = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

    const response = await fetch(`${backendUrl}/api/user/${userId}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Failed to update user profile" },
        { status: response.status }
      );
    }

    const updatedUser = await response.json();
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};