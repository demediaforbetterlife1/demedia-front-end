import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const userId = request.headers.get('user-id');
    const authHeader = request.headers.get('authorization');
    const debug: any = { step: "start", backendUrl, userId };

    const headers: HeadersInit = { cache: "no-store" };
    if (userId) headers['user-id'] = userId;
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(backendUrl, { 
      cache: "no-store",
      headers
    });
    debug.status = res.status;
    debug.statusText = res.statusText;

    const text = await res.text();
    debug.responseText = text.slice(0, 300); // نعرض أول 300 حرف بس

    if (!res.ok) {
      return NextResponse.json({ error: true, message: "Backend returned error", debug }, { status: res.status });
    }

    const data = JSON.parse(text);
    debug.ok = true;
    debug.postsCount = Array.isArray(data) ? data.length : 0;
    console.log('Posts API: Returning', Array.isArray(data) ? data.length : 0, 'posts');
    console.log('Posts API: First post sample:', Array.isArray(data) && data.length > 0 ? {
      id: data[0].id,
      content: data[0].content?.substring(0, 50) + '...',
      user: data[0].user
    } : 'No posts');
    // Return the posts array directly instead of wrapping it
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error", debug: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const body = await request.json();
    const userId = request.headers.get('user-id');
    
    console.log('Creating post via backend:', { userId, body });

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId || '',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('Backend post creation failed:', res.status, text);
      return NextResponse.json({ error: true, message: "Backend returned error", status: res.status, response: text }, { status: res.status });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}