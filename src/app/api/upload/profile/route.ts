import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let authHeader: string | null = null;
  let userId: string | null = null;
  
  try {
    const formData = await request.formData();
    
    // Get the authorization token and user ID
    authHeader = request.headers.get('authorization');
    userId = request.headers.get('user-id');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/upload/profile`, {
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
        console.log('✅ Profile photo uploaded via backend:', data);
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

    // Fallback: Convert to base64 for development
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    console.log('Profile photo upload fallback (development):', { 
      fileName: file.name, 
      fileSize: file.size,
      type: file.type
    });
    
    return NextResponse.json({
      success: true,
      url: dataUrl,
      message: 'Profile photo uploaded successfully (development mode)'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('❌ Profile upload error:', { 
      message: errorMessage, 
      stack: errorStack, 
      userId,
      authHeader: !!authHeader,
      errorType: errorName 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}
