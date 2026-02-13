import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string || request.cookies.get('token')?.value;
    const userId = formData.get('userId') as string || request.headers.get('user-id');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const videoFile = formData.get('video') as File;
    
    if (!videoFile) {
      return NextResponse.json({ error: 'No video file uploaded' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'Video file too large',
        details: `Maximum file size is 100MB. Your file is ${(videoFile.size / (1024 * 1024)).toFixed(2)}MB.`
      }, { status: 413 });
    }

    // Forward the entire FormData as-is to backend
    // Do NOT manually set Content-Type - let Node.js fetch API handle it
    const backendResponse = await fetch('https://demedia-backend.fly.dev/api/upload/video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'user-id': userId || '',
      },
      body: formData,
      signal: AbortSignal.timeout(180000),
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json(data);
    }

    const errorText = await backendResponse.text();
    return NextResponse.json({ 
      error: 'Upload failed',
      details: errorText
    }, { status: backendResponse.status });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
