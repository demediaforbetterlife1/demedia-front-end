import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('🧪 Testing backend connection...');
    
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const res = await fetch(backendUrl, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = await res.text();
    console.log('Backend test response:', { status: res.status, textLength: text.length });

    if (!res.ok) {
      return NextResponse.json({ 
        error: true, 
        message: "Backend connection failed", 
        status: res.status,
        response: text.substring(0, 500)
      });
    }

    const data = JSON.parse(text);
    return NextResponse.json({
      success: true,
      postsCount: Array.isArray(data) ? data.length : 0,
      samplePost: Array.isArray(data) && data.length > 0 ? {
        id: data[0].id,
        content: data[0].content?.substring(0, 100),
        user: data[0].user,
        createdAt: data[0].createdAt
      } : null,
      allPosts: data
    });

  } catch (error: any) {
    console.error('Backend test error:', error);
    return NextResponse.json({
      error: true,
      message: error?.message || "Unknown error",
      details: error
    }, { status: 500 });
  }
}