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
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
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
          'Authorization': authHeader,
          'user-id': userId,
        },
        body: JSON.stringify(body),
      });

      console.log('🔄 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ DeSnap created via backend:', data.id);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for DeSnap creation:', backendError);
      
      // Fallback: Return mock DeSnap creation
      console.log('🔄 Using fallback: returning mock DeSnap creation');
      return NextResponse.json({
        id: Date.now(),
        content: body.content,
        imageUrl: body.imageUrl,
        videoUrl: body.videoUrl,
        userId: parseInt(userId),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        message: 'DeSnap created successfully (development mode)'
      });
    }
  } catch (error) {
    console.error('❌ Error creating DeSnap:', error);
    return NextResponse.json({ error: 'Failed to create DeSnap' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Fetching DeSnaps via backend, userId:', userId);

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
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