import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const userId = request.headers.get('user-id');
    const authHeader = request.headers.get('authorization');
    const debug: any = { step: "start", backendUrl, userId };

    console.log('📥 Fetching posts from backend:', { userId, hasAuth: !!authHeader });

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
    debug.responseText = text.slice(0, 300);

    console.log('📡 Backend posts response:', { status: res.status, textLength: text.length });

    if (!res.ok) {
      console.error('❌ Backend posts fetch failed:', res.status, text);
      return NextResponse.json({ error: true, message: "Backend returned error", debug }, { status: res.status });
    }

    const data = JSON.parse(text);
    debug.ok = true;
    debug.postsCount = Array.isArray(data) ? data.length : 0;
    console.log('📊 Posts API: Returning', Array.isArray(data) ? data.length : 0, 'posts');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('📝 First post sample:', {
        id: data[0].id,
        content: data[0].content?.substring(0, 50) + '...',
        user: data[0].user,
        createdAt: data[0].createdAt
      });
    } else {
      console.log('📭 No posts found in response');
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Posts fetch error:', error);
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
    const authHeader = request.headers.get('authorization');
    
    console.log('🚀 Creating post via backend:', { 
      userId, 
      authHeader: authHeader ? 'Present' : 'Missing',
      body: {
        ...body,
        content: body.content?.substring(0, 50) + '...'
      }
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'user-id': userId || '',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log('📡 Backend response:', { status: res.status, textLength: text.length });

    if (!res.ok) {
      console.error('❌ Backend post creation failed:', res.status, text);
      return NextResponse.json({ error: true, message: "Backend returned error", status: res.status, response: text }, { status: res.status });
    }

    const data = JSON.parse(text);
    console.log('✅ Post created successfully:', { 
      id: data.id, 
      content: data.content?.substring(0, 50) + '...',
      user: data.user 
    });
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Post creation error:', error);
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}