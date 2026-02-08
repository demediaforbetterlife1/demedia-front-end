import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Configure route to accept large files - DISABLE bodyParser for multipart/form-data
export const config = {
  api: {
    bodyParser: false, // CRITICAL: Disable bodyParser for FormData uploads
  },
};

// Increase max duration for video processing - Vercel allows up to 300s on Pro
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Video upload request received');
    
    const formData = await request.formData();

    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      console.error('❌ No authentication token');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');
    
    console.log('🔑 Auth info:', {
      hasToken: !!token,
      tokenLength: token.length,
      userId: userId
    });

    // Check video file size before processing
    const videoFile = formData.get('video') as File;
    if (!videoFile) {
      console.error('❌ No video file in request');
      return NextResponse.json({ error: 'No video file uploaded' }, { status: 400 });
    }

    console.log('📹 Video file:', {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
      sizeMB: (videoFile.size / (1024 * 1024)).toFixed(2)
    });

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'Video file too large',
        details: `Maximum file size is 100MB. Your file is ${(videoFile.size / (1024 * 1024)).toFixed(2)}MB. Please compress your video or choose a shorter clip.`,
        maxSize: maxSize,
        actualSize: videoFile.size
      }, { status: 413 });
    }

    // Try to connect to the actual backend first
    try {
      console.log('Uploading video to backend:', {
        size: videoFile.size,
        type: videoFile.type,
        name: videoFile.name
      });

      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/upload/video`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
        },
        body: formData,
        // Add timeout for large uploads
        signal: AbortSignal.timeout(120000), // 2 minutes
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ Video uploaded to backend successfully');
        return NextResponse.json(data);
      } else if (backendResponse.status === 413) {
        // Backend also says file is too large
        return NextResponse.json({ 
          error: 'Video file too large for server',
          details: 'The video file exceeds the server upload limit. Please compress your video or choose a shorter clip.',
        }, { status: 413 });
      } else {
        console.log('Backend video upload failed with status:', backendResponse.status);
        const errorText = await backendResponse.text();
        console.log('Backend error:', errorText);
        console.log('Falling back to local storage');
      }
    } catch (backendError: any) {
      if (backendError.name === 'AbortError') {
        return NextResponse.json({ 
          error: 'Upload timeout',
          details: 'The video upload took too long. Please try a smaller file or check your internet connection.',
        }, { status: 408 });
      }
      console.log('Backend not available for video upload:', backendError.message);
      console.log('Using fallback local storage');
    }

    // Fallback: Save video locally for development
    console.log('Saving video locally...');

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'local-uploads', 'videos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.error('Error creating uploads directory:', err);
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const safeName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `video-${timestamp}-${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert File to Buffer and write to disk
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the local URL (no need for absolute URL now that mediaUtils handles it)
    const videoUrl = `/local-uploads/videos/${filename}`;

    // For thumbnail, we'll just use a default for now since we can't easily generate one server-side without ffmpeg
    // The frontend generates a thumbnail for preview anyway
    const thumbnailUrl = '/assets/images/default-post.svg';

    console.log('✅ Video saved locally:', {
      fileName: filename,
      size: videoFile.size,
      videoUrl
    });

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      filename: filename,
      size: videoFile.size,
      duration: 0,
      message: 'Video uploaded successfully (local storage)'
    });
  } catch (error: any) {
    console.error('❌ Error uploading video:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred while uploading the video.'
    }, { status: 500 });
  }
}
