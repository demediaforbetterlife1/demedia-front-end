import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const token = request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = request.headers.get('user-id');
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

    const backendFormData = new FormData();
    backendFormData.append('video', videoFile);
    
    const thumbnail = formData.get('thumbnail');
    const duration = formData.get('duration');
    const visibility = formData.get('visibility');
    
    if (thumbnail) backendFormData.append('thumbnail', thumbnail as string);
    if (duration) backendFormData.append('duration', duration as string);
    if (visibility) backendFormData.append('visibility', visibility as string);
    if (userId) backendFormData.append('userId', userId);

    const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/upload/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'user-id': userId || '',
      },
      body: backendFormData,
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
