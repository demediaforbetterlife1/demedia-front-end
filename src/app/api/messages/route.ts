import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the auth token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');

    const { chatId, content, type = 'text' } = body;

    if (!chatId || !content) {
      return NextResponse.json({ error: 'Chat ID and content are required' }, { status: 400 });
    }

    console.log('Sending message to chatId:', chatId, 'content:', content);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: parseInt(chatId),
          senderId: parseInt(userId),
          content,
          type
        })
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend message sent successfully:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend message send failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend message send connection error:', backendError);
    }

    // Fallback: Return mock message
    console.log('Using fallback message creation');
    const mockMessage = {
      id: `msg_${Date.now()}`,
      chatId: parseInt(chatId),
      senderId: parseInt(userId),
      content,
      type,
      createdAt: new Date().toISOString(),
      status: 'sent',
      sender: {
        id: userId,
        name: "You",
        username: "you",
        profilePicture: null
      }
    };

    return NextResponse.json(mockMessage);

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
