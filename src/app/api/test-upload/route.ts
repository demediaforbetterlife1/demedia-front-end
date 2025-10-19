import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('Test upload endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Convert to base64 for testing
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      message: 'Test upload successful'
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json({ error: 'Test upload failed' }, { status: 500 });
  }
}
