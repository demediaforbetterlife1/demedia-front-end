import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // <- هنا النوع الصح
) => {
  try {
    // فك الـ Promise عشان تجيب الـ id
    const { id: userId } = await context.params;
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
