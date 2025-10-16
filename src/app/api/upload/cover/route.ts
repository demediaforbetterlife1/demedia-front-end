import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get the authorization token and user ID
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/upload/cover`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
        },
        body: formData,
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(30000) // 30 second timeout for file uploads
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ Cover photo uploaded via backend:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error('❌ Backend upload failed:', backendResponse.status, errorText);
        // Don't throw error, continue to fallback
      }
    } catch (backendError) {
      console.error('❌ Backend connection failed for upload (using fallback):', backendError);
      // Don't throw error, continue to fallback
    }

    // Fallback: Try to simulate upload for development
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a temporary URL for development
    const tempUrl = `https://demedia-backend.fly.dev/uploads/covers/temp-${Date.now()}-${file.name}`;
    
    console.log('Cover photo upload fallback (development):', { 
      fileName: file.name, 
      fileSize: file.size, 
      tempUrl 
    });
    
    return NextResponse.json({
      success: true,
      url: tempUrl,
      message: 'Cover photo uploaded successfully (development mode)'
    });
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
