import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Parse body safely
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    console.log('[API] Incoming interests:', body);

    if (!body?.interests || !Array.isArray(body.interests)) {
      return NextResponse.json(
        { error: 'Interests array is required' },
        { status: 400 }
      );
    }

    // Extract token
    const token =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('[API] Token exists?', Boolean(token));

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/users/${userId}/interests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    console.log('[API] Backend status:', backendResponse.status);

    // Read response safely
    const raw = await backendResponse.text();

    console.log('[API] Backend raw response:', raw);

    let data: any = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    // If backend returned empty body (like 204)
    if (!raw && backendResponse.status === 204) {
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error: any) {
    console.error('[API] Save interests error:', error);

    return NextResponse.json(
      {
        error: 'Failed to save interests. Please try again.',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
