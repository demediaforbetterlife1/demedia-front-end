import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
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
      const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
      const finalUrl = `${backendUrl}/api/posts/user/${userId}${viewerId ? `?viewerId=${viewerId}` : ''}`;
      
      const response = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-id': viewerId || userId,
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
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
