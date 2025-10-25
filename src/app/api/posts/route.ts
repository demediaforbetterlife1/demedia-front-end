import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const userId = request.headers.get('user-id');
    const authHeader = request.headers.get('authorization');

    const headers: HeadersInit = { cache: "no-store" };
    if (userId) headers['user-id'] = userId;
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(backendUrl, { 
      cache: "no-store",
      headers
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: true, message: "Backend returned error" }, { status: res.status });
    }

    const data = JSON.parse(text);
    
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

    if (!res.ok) {
      return NextResponse.json({ error: true, message: "Backend returned error", status: res.status, response: text }, { status: res.status });
    }

    const data = JSON.parse(text);
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Post creation error:', error);
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}