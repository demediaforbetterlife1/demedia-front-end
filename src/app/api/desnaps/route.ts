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
    // Get token from multiple sources
    let token = null;
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('✅ Token from Authorization header');
    }
    
    // Fallback to cookie
    if (!token) {
      token = request.cookies.get('token')?.value || null;
      if (token) {
        console.log('✅ Token from cookie');
      }
    }
    
    if (!token) {
      console.error('❌ No authorization token found');
      return NextResponse.json({ 
        error: 'Authorization required. Please log in again.',
        details: 'No token found in Authorization header or cookie'
      }, { status: 401 });
    }

    const body = await request.json();
    const userId = request.headers.get('user-id') || body.userId;
    
    console.log('📝 Creating DeSnap:', {
      hasContent: !!body.content,
      hasThumbnail: !!body.thumbnail,
      visibility: body.visibility,
      userId: userId
    });

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Forwarding to backend:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`,
          'user-id': userId?.toString() || '',
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        
        let errorMessage = 'Failed to create DeSnap';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = errorText || `Backend error: ${response.status}`;
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: errorText
        }, { status: response.status });
      }

      const data = await response.json();
      console.log('✅ DeSnap created successfully:', data.id);
      return NextResponse.json(data);
      
    } catch (backendError) {
      console.error('❌ Backend connection failed:', backendError);
      return NextResponse.json({ 
        error: 'Backend connection failed. Please try again.',
        details: backendError instanceof Error ? backendError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in DeSnap API route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
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
    
    // Get filter parameter from URL
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    
    console.log('Fetching DeSnaps via backend with filter:', filter);

    // Forward request to backend with filter parameter
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps?filter=${filter}`, {
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
      console.log('✅ Fetched DeSnaps via backend:', data.length, 'DeSnaps (filter:', filter, ')');
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
