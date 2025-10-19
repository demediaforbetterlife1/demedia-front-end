import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Story creation request:', body);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      console.log('Backend story creation response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend story created:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend story creation failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend story creation connection error:', backendError);
    }

    // Fallback: Create a mock story
    console.log('Using fallback story creation');
    const mockStory = {
      id: `story_${userId}_${Date.now()}`,
      content: body.content || 'New Story',
      userId: parseInt(userId),
      visibility: body.visibility || 'public',
      durationHours: body.durationHours || 24,
      views: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (body.durationHours || 24) * 60 * 60 * 1000).toISOString(),
      message: 'Story created (fallback mode)'
    };

    console.log('Returning mock story:', mockStory);
    return NextResponse.json(mockStory);

  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Stories API called with userId:', userId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/stories', {
        headers: {
          'Authorization': authHeader || '',
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend stories response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend stories data received:', data.length, 'stories');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend stories fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend stories connection error:', backendError);
    }

    // Fallback: Return empty stories array
    console.log('Using fallback stories data');
    return NextResponse.json([]);

  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
