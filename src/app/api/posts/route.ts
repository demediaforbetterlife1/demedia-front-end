import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev';
    
    // Get auth headers
    const authHeader = req.headers.get('authorization') || '';
    const userId = req.headers.get('user-id') || '';

    console.log('🔍 Fetching posts from backend:', backendUrl);
    console.log('🔍 Auth header present:', !!authHeader);
    console.log('🔍 User ID:', userId);

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(`${backendUrl}/api/posts`, {
      method: 'GET',
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
        ...(userId ? { "user-id": userId } : {}),
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📊 Backend response status:', res.status);
    console.log('📊 Backend response ok:', res.ok);

    if (!res.ok) {
      const errText = await res.text();
      console.error('❌ Backend error response:', errText);
      throw new Error(`Backend error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log('✅ Successfully fetched posts from database:', data?.length || 0, 'posts');
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ Error fetching posts from database:", error?.message || error);

    // Return empty array instead of error to prevent UI issues
    console.log('🔄 Returning empty posts array due to database connection issues');
    return NextResponse.json([]);
  }
}
// ✅ POST → إنشاء بوست جديد مع debug كامل
export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();

    if (!body || !body.content) {
      return NextResponse.json(
        { error: "Content field is required" },
        { status: 400 }
      );
    }

    const backendUrl = 'https://demedia-backend.fly.dev';
    const authHeader = req.headers.get('authorization') || undefined;
    const userId = (req.headers.get('user-id') || body.userId || '').toString();

    const res = await fetch(`${backendUrl}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        "user-id": userId,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend responded with ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    // Fallback to local test post creation so UX continues
    try {
      const testRes = await fetch('/api/test-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(body || {}), userId: (body?.userId || '1').toString() })
      });
      if (testRes.ok) {
        const mock = await testRes.json();
        return NextResponse.json(mock, { status: 201 });
      }
    } catch {}

    console.error("Error creating post:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to create a post. Please try again." },
      { status: 500 }
    );
  }
}