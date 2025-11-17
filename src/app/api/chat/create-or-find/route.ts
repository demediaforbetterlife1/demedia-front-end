import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { participantId } = await request.json();
    
    // Get the auth token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const authHeader = `Bearer ${token}`;

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    console.log('Creating/finding chat with participant:', participantId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/chat/create-or-find', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: parseInt(participantId) })
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend chat data received:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend chat creation failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend chat connection error:', backendError);
    }

    // Fallback: Create a mock chat ID
    console.log('Using fallback chat creation');
    const mockChatId = `chat_${participantId}_${Date.now()}`;
    
    return NextResponse.json({
      id: mockChatId,
      participantId: parseInt(participantId),
      message: 'Chat created (fallback mode)'
    });

  } catch (error) {
    console.error('Error creating/finding chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
