import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

// GET /api/desnaps/[id]/comments - Get comments for a DeSnap
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/desnaps/${id}/comments`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(Array.isArray(data) ? data : []);
      }

      return NextResponse.json([], { status: 200 }); // Return empty array if not found
    } catch (error) {
      console.error('Error fetching DeSnap comments:', error);
      return NextResponse.json([], { status: 200 }); // Return empty array on error
    }
  } catch (error) {
    console.error('Error in GET /api/desnaps/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/desnaps/[id]/comments - Create a comment on a DeSnap
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    const body = await request.json();
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/desnaps/${id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: body.content.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      const errorText = await response.text();
      return NextResponse.json({ error: errorText || 'Failed to create comment' }, { status: response.status });
    } catch (error) {
      console.error('Error creating DeSnap comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/desnaps/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

