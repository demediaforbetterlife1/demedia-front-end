import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    
    // Parse the request body
    const body = await request.json();
    
    console.log('[API] Save interests request received:', {
      userId,
      interests: body.interests,
      interestCount: body.interests?.length
    });

    // Validate interests
    if (!body.interests || !Array.isArray(body.interests)) {
      return NextResponse.json(
        { error: 'Interests array is required' },
        { status: 400 }
      );
    }

    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    // Forward to backend with proper headers
    const backendResponse = await fetch(`${BACKEND_URL}/api/users/${userId}/interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    console.log('[API] Backend response status:', backendResponse.status);

    // Get response data
    const data = await backendResponse.json();
    
    console.log('[API] Backend response data:', data);

    // Return the response
    return NextResponse.json(data, { status: backendResponse.status });
    
  } catch (error: any) {
    console.error('[API] Save interests error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save interests. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
