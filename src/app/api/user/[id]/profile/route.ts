import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: userId } = context.params;
    const body = await request.json();

    // استخدم عنوان الباك إند الثابت مباشرة (بدل process.env لو بتواجه مشكلة في Vercel)
    const backendUrl = "https://demedia-backend.fly.dev";

    const response = await fetch(`${backendUrl}/api/users/${userId}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        { error: errorText || "Failed to update user profile" },
        { status: response.status }
      );
    }

    const updatedUser = await response.json();
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
