import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('➡️ Like request for post:', postId, 'by user:', userId);

    const backendResponse = await fetch(
      `https://demedia-backend.fly.dev/api/posts/${postId}/like`,
      {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "user-id": userId,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await backendResponse.text();
    if (!backendResponse.ok) {
      console.error('❌ Backend like failed:', backendResponse.status, text);
      return NextResponse.json(
        { error: true, message: "Backend like failed", details: text },
        { status: backendResponse.status }
      );
    }

    const data = JSON.parse(text);
    console.log('✅ Like updated via backend:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('🔥 Error handling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}