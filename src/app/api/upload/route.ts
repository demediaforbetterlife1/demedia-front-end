import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'image';
    
    console.log('Upload request:', { type, fileName: file?.name, fileSize: file?.size });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Try to connect to the actual backend first
    try {
      const backendFormData = new FormData();
      backendFormData.append('file', file);
      backendFormData.append('type', type);
      backendFormData.append('userId', userId);

      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        body: backendFormData
      });

      console.log('Backend upload response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend upload successful:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend upload failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend upload connection error:', backendError);
    }

    // Fallback: Convert to base64 for development
    console.log('Using fallback upload response');
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    const mockUpload = {
      success: true,
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: type,
      message: 'File uploaded (fallback mode)'
    };

    console.log('Returning base64 upload:', { filename: file.name, type: file.type });
    return NextResponse.json(mockUpload);

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
