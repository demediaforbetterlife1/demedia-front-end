import { NextRequest, NextResponse } from "next/server";



export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
  },
};

/**
 * DeSnaps API - Proxies requests to backend
 * Handles story creation and management
 */

export async function POST(request: NextRequest) {
  try {
    // Try to get token from Authorization header first, then fall back to cookie
    let token = null;
    let authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // If no token in header, try cookie
    if (!token) {
      token = request.cookies.get('token')?.value || null;
    }
    
    if (!token) {
      console.error('❌ No authorization token found in header or cookie');
      return NextResponse.json({ 
        error: 'Authorization header is required. Please include a valid Bearer token in the Authorization header.' 
      }, { status: 401 });
    }
    
    const body = await request.json();

    console.log('Creating new DeSnap via backend:', body);

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for DeSnap creation:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`, // Forward cookie for backend auth
        },
        body: JSON.stringify(body),
      });

      console.log('🔄 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        return NextResponse.json({ 
          error: errorText || `Backend responded with ${response.status}` 
        }, { status: response.status });
      }

      const data = await response.json();
      console.log('✅ DeSnap created via backend:', data.id);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for DeSnap creation:', backendError);
      return NextResponse.json({ 
        error: `Backend connection failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error creating DeSnap:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create DeSnap' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get('token')?.value;
    let authHeader = request.headers.get('authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }
    
    console.log('Fetching DeSnaps via backend');

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`, // Forward cookie for backend auth
          'Content-Type': 'application/json',
        },
      });

      console.log('🔄 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched DeSnaps via backend:', data.length, 'DeSnaps');
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed:', backendError);
      
      // Return empty array if backend is unavailable
      console.log('🔄 Backend unavailable: returning empty DeSnaps array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching DeSnaps:', error);
    return NextResponse.json({ error: 'Failed to fetch DeSnaps' }, { status: 500 });
  }
}
