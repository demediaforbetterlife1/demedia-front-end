import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

export async function POST(request: NextRequest) {
  console.log('[complete-setup] API called');
  
  try {
    // Get request body
    const body = await request.json();
    console.log('[complete-setup] Request body:', body);

    // Forward cookies and auth headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
      console.log('[complete-setup] Forwarding cookies');
    }
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
      console.log('[complete-setup] Forwarding Authorization header');
    }

    // Forward request to backend
    console.log('[complete-setup] Forwarding to backend:', `${BACKEND_URL}/api/auth/complete-setup`);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/complete-setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    console.log('[complete-setup] Backend response status:', backendResponse.status);

    // Get response data
    let responseData;
    const responseText = await backendResponse.text();
    console.log('[complete-setup] Backend raw response:', responseText);
    
    try {
      responseData = JSON.parse(responseText);
      console.log('[complete-setup] Backend parsed response:', responseData);
    } catch (parseError) {
      console.error('[complete-setup] Failed to parse backend response:', parseError);
      return NextResponse.json(
        { 
          error: 'Backend returned invalid response', 
          details: responseText 
        },
        { status: 500 }
      );
    }

    // Forward the response
    return NextResponse.json(responseData, { 
      status: backendResponse.status 
    });

  } catch (error: any) {
    console.error('[complete-setup] Error:', error);
    console.error('[complete-setup] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to complete setup', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}