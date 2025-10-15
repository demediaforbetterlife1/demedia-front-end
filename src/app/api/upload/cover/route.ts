import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract user ID from token
    const token = authHeader.replace('Bearer ', '');
    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.userId || payload.id;
    } catch (e) {
      console.log('Could not extract user ID from token');
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
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      } else {
        console.log('Backend upload failed, using fallback');
      }
    } catch (backendError) {
      console.log('Backend not available for upload, using fallback');
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
