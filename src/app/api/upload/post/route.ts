import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://demedia-backend.fly.dev';
    
    console.log('🔄 Uploading post image to backend:', backendUrl);

    // Forward request to backend with proper authentication
    const backendResponse = await fetch(`${backendUrl}/api/upload/post`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(60000) // 60 second timeout for file uploads
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Backend post upload failed:', backendResponse.status, errorText);
      
      // Return specific error messages
      if (backendResponse.status === 401) {
        return NextResponse.json({ 
          error: 'Authentication failed. Please log in again.',
          details: 'Your session may have expired'
        }, { status: 401 });
      }
      
      if (backendResponse.status === 413) {
        return NextResponse.json({ 
          error: 'Image file too large. Please choose a smaller image.',
          details: 'Maximum file size is 10MB'
        }, { status: 413 });
      }

      if (backendResponse.status === 400) {
        return NextResponse.json({ 
          error: 'Invalid image file or request.',
          details: errorText
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Image upload failed. Please try again.',
        details: errorText
      }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('✅ Post image uploaded successfully:', data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Post upload error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Upload timeout. Please try again with a smaller file.',
        details: 'The upload took too long to complete'
      }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}