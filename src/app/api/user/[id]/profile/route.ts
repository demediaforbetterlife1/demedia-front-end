// src/app/api/users/[id]/profile/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

// GET: جلب بيانات البروفايل
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // align with validator expecting Promise
) => {
  try {
    const { id: userId } = await context.params; // await promised params
    const response = await fetch(`${BACKEND_URL}/api/user/${userId}/profile`);

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
  context: { params: Promise<{ id: string }> } // align with validator expecting Promise
) => {
  try {
    const { id: userId } = await context.params; // await promised params
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/user/${userId}/profile`, {
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
