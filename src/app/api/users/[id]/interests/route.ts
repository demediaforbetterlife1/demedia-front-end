import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    
    console.log('[API] Get interests request for user:', userId);

    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/users/${userId}/interests`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
    
  } catch (error: any) {
    console.error('[API] Get interests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
}

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
      interestCount: body.interests?.length,
      bodyKeys: Object.keys(body),
      fullBody: body
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

    if (!token) {
      console.error('[API] No authentication token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/users/${userId}/interests`;
    console.log('[API] Forwarding to backend:', backendUrl);
    console.log('[API] Request body being sent:', JSON.stringify(body));

    // Forward to backend with proper headers and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[API] Backend response status:', backendResponse.status);
      console.log('[API] Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

      // Get response data
      let data;
      const contentType = backendResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await backendResponse.json();
      } else {
        const text = await backendResponse.text();
        console.error('[API] Non-JSON response from backend:', text);
        data = { error: 'Invalid response from server', details: text };
      }
      
      console.log('[API] Backend response data:', data);

      // If backend returned an error, pass it through
      if (!backendResponse.ok) {
        return NextResponse.json(
          data || { error: 'Failed to save interests' },
          { status: backendResponse.status }
        );
      }

      // Return the successful response
      return NextResponse.json(data, { status: 200 });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[API] Backend request timeout');
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('[API] Save interests error:', error);
    console.error('[API] Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to save interests. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
