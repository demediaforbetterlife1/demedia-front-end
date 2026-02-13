import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

async function uploadToBackendWithRetry(formData: FormData, token: string, maxRetries: number = 2) {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/upload/video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: AbortSignal.timeout(300000), // 5 minutes timeout per request
      });

      if (backendResponse.ok) {
        return { success: true, response: backendResponse };
      }

      // Non-5xx errors: don't retry
      if (backendResponse.status < 500) {
        return { success: false, response: backendResponse, shouldRetry: false };
      }

      // 5xx errors: can retry
      lastError = { status: backendResponse.status, text: await backendResponse.text() };
      if (attempt < maxRetries) {
        console.log(`Backend upload failed (attempt ${attempt + 1}), retrying...`);
        // Wait a bit before retrying
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`Backend upload error (attempt ${attempt + 1}), retrying...`, error.message);
        // Wait before retrying
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  
  return { success: false, error: lastError, shouldRetry: true };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const userId = formData.get('userId') as string;
    const videoFile = formData.get('video') as File;
    const duration = formData.get('duration') as string;
    const visibility = formData.get('visibility') as string;
    const thumbnail = formData.get('thumbnail') as string;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

    // Create fresh FormData for backend with only the fields we need
    const toBackendFormData = new FormData();
    toBackendFormData.append('video', videoFile);
    if (duration) toBackendFormData.append('duration', duration);
    if (visibility) toBackendFormData.append('visibility', visibility);
    if (thumbnail) toBackendFormData.append('thumbnail', thumbnail);
    if (userId) toBackendFormData.append('userId', userId);

    // Upload with automatic retry for network failures
    const uploadResult = await uploadToBackendWithRetry(toBackendFormData, token);

    if (uploadResult.success && uploadResult.response) {
      const data = await uploadResult.response.json();
      return NextResponse.json(data);
    }

    if (uploadResult.response) {
      const errorText = uploadResult.response.text ? await uploadResult.response.text() : '';
      
      // More helpful error messages based on status
      let details = errorText;
      if (uploadResult.response.status === 413) {
        details = 'Video file is too large. Maximum is 100MB.';
      } else if (uploadResult.response.status === 408) {
        details = 'Upload timeout. The backend server may be slow. Try again in a moment.';
      } else if (uploadResult.response.status === 500 && errorText.includes('Content-Type')) {
        details = 'Server format error. Please try uploading again.';
      }
      
      return NextResponse.json({ 
        error: 'Upload failed',
        details: details
      }, { status: uploadResult.response.status });
    }

    // Network error or timeout after retries
    return NextResponse.json({
      error: 'Upload failed after retries',
      details: 'Server is not responding. Please try again in a moment.'
    }, { status: 503 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
