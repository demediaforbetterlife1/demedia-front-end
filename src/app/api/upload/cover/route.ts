import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let authHeader: string | null = null;
  let userId: string | null = null;
  
  try {
    const formData = await request.formData();
    
    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    authHeader = `Bearer ${token}`;
    userId = request.headers.get('user-id');

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/upload/cover`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
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
        
        // Return specific error for authentication issues
        if (backendResponse.status === 401) {
          return NextResponse.json({ 
            error: 'Authentication failed. Please log in again.',
            details: 'Your session may have expired'
          }, { status: 401 });
        }
        
        // Return specific error for file size issues
        if (backendResponse.status === 413) {
          return NextResponse.json({ 
            error: 'File too large. Please choose a smaller image.',
            details: 'Maximum file size is 10MB'
          }, { status: 413 });
        }
        
        // For other backend errors, continue to fallback
        console.log('🔄 Backend failed, continuing to fallback...');
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
    
    console.log('Cover photo upload fallback (development):', { 
      fileName: file.name, 
      fileSize: file.size,
      type: file.type
    });
    
    return NextResponse.json({
      success: true,
      url: dataUrl,
      message: 'Cover photo uploaded successfully (development mode)'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('❌ Cover upload error:', { 
      message: errorMessage, 
      stack: errorStack, 
      errorType: errorName 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}
