import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get('viewerId');
    
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return NextResponse.json([]);
    }

    try {
      const backendUrl = `https://demedia-backend-production.up.railway.app/api/stories/user/${userId}${viewerId ? `?viewerId=${viewerId}` : ''}`;
      
      const backendResponse = await fetch(backendUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-id': viewerId || userId,
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
          if (!story || !story.id) return false;
          
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
