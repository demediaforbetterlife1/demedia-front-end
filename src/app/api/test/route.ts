import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🧪 Test API endpoint called");

  const testData = {
    message: "API is working!",
    timestamp: new Date().toISOString(),
    status: "success",
    posts: [
      {
        id: 1,
        title: "Test Post",
        content: "This is a test post to verify the API is working",
        imageUrl: null,
        imageUrls: [],
        videoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 1,
          username: "testuser",
          name: "Test User",
          profilePicture: null,
        },
      },
    ],
  };

  console.log("✅ Test API returning data:", testData);

  return NextResponse.json(testData, { status: 200 });
}
