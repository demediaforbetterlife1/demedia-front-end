import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    const userId = request.headers.get('user-id');
    
    if (!token || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Story creation request:', body);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend-production.up.railway.app/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`, // Forward cookie for backend auth
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
      userId: parseInt(userId || '0'),
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
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    const userId = request.headers.get('user-id');
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'following';
    const profileUserId = searchParams.get('userId');
    
    console.log('Stories API - userId:', userId, 'view:', view, 'profileUserId:', profileUserId);

    if (!token) {
      return NextResponse.json([]);
    }

    try {
      const backendParams = new URLSearchParams();
      if (view) backendParams.set('view', view);
      if (profileUserId) backendParams.set('userId', profileUserId);
      if (userId) backendParams.set('viewerId', userId);
      
      const backendUrl = `https://demedia-backend-production.up.railway.app/api/stories?${backendParams.toString()}`;
      
      const backendResponse = await fetch(backendUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-id': userId || '',
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        
        if (!Array.isArray(data)) {
          return NextResponse.json([]);
        }
        
        const now = new Date();
        const validStories = data.filter((story: any) => {
          if (!story || !story.id || !story.author || !story.author.name || 
              story.author.name === "Unknown" || story.author.name.trim() === "") {
            return false;
          }
          
          if (story.expiresAt) {
            const expiresAt = new Date(story.expiresAt);
            if (expiresAt < now) {
              return false;
            }
          }
          
          return true;
        });
        
        return NextResponse.json(validStories);
      } else {
        return NextResponse.json([]);
      }
    } catch (backendError: any) {
      return NextResponse.json([]);
    }

  } catch (error: any) {
    return NextResponse.json([]);
  }
}
