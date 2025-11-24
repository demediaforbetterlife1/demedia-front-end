import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/upload/video`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
        },
        body: formData,
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      } else {
        console.log('Backend video upload failed, using fallback');
      }
    } catch (backendError) {
      console.log('Backend not available for video upload, using fallback');
    }

    // Fallback: Save video locally for development
    const videoFile = formData.get('video') as File;
    if (!videoFile) {
      return NextResponse.json({ error: 'No video file uploaded' }, { status: 400 });
    }

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

    console.log('Video saved locally:', {
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
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
