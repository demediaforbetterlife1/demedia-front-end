import { NextRequest, NextResponse } from "next/server";

/**
 * Personalized Posts API - Proxies requests to backend
 * Frontend communicates with backend, backend handles database operations
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Fetching personalized posts via backend, userId:', userId, 'interests:', body.interests);

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/posts/personalized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'user-id': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fetched personalized posts via backend:', data.length, 'posts');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching personalized posts via backend:', error);
    return NextResponse.json({ error: 'Failed to fetch personalized posts' }, { status: 500 });
  }
}