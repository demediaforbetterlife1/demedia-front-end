import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    console.log('[API] Login request received:', {
      phoneNumber: body.phoneNumber,
      hasPassword: !!body.password
    });

    // Forward to backend with proper headers
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[API] Backend response status:', backendResponse.status);

    // Get response data
    const data = await backendResponse.json();
    
    console.log('[API] Backend response data:', {
      success: !!data.user,
      hasToken: !!data.token,
      error: data.error
    });

    // If successful and we have a token, set it in a cookie
    if (data.token && backendResponse.ok) {
      const response = NextResponse.json(data, { status: backendResponse.status });
      
      // Set token in cookie for persistence
      response.cookies.set('token', data.token, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      
      console.log('[API] Token set in cookie');
      return response;
    }

    // Return the response as-is
    return NextResponse.json(data, { status: backendResponse.status });
    
  } catch (error: any) {
    console.error('[API] Login error:', error);
    return NextResponse.json(
      { 
        error: 'Login failed. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
