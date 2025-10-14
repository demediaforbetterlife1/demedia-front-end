import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Personalized suggestions request:', body);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/suggestions/personalized', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend personalized suggestions data received:', data.length, 'suggestions');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend personalized suggestions failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend personalized suggestions connection error:', backendError);
    }

    // Fallback: Return mock personalized suggestions data
    console.log('Using fallback personalized suggestions data');
    const mockPersonalizedSuggestions = [
      {
        id: 4,
        name: "Alice Brown",
        username: "aliceb",
        profilePicture: "https://demedia-backend.fly.dev/uploads/profiles/file-1760292243693-835944557.jpg",
        mutualConnections: 8,
        reason: "Based on your activity",
        score: 0.95
      },
      {
        id: 5,
        name: "Bob Wilson",
        username: "bobw",
        profilePicture: null,
        mutualConnections: 4,
        reason: "Similar content preferences",
        score: 0.87
      },
      {
        id: 6,
        name: "Carol Davis",
        username: "carold",
        profilePicture: null,
        mutualConnections: 6,
        reason: "Location-based recommendation",
        score: 0.82
      }
    ];

    return NextResponse.json(mockPersonalizedSuggestions);

  } catch (error) {
    console.error('Error fetching personalized suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
