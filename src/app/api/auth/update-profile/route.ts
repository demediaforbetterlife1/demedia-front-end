import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

export async function POST(request: NextRequest) {
  console.log('[update-profile] API called');
  
  try {
    // Get request body
    const body = await request.json();
    console.log('[update-profile] Request body:', body);

    // Forward cookies and auth headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
    }
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    // Forward request to backend
    console.log('[update-profile] Forwarding to backend:', `${BACKEND_URL}/api/auth/update-profile`);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/update-profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    console.log('[update-profile] Backend response status:', backendResponse.status);

    // Get response data
    const responseData = await backendResponse.json();
    console.log('[update-profile] Backend response data:', responseData);

    // Forward the response
    return NextResponse.json(responseData, { 
      status: backendResponse.status 
    });

  } catch (error: any) {
    console.error('[update-profile] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}