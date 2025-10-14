import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Fetching suggestions for user:', userId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/suggestions', {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend suggestions data received:', data.length, 'suggestions');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend suggestions fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend suggestions connection error:', backendError);
    }

    // Fallback: Return mock suggestions data
    console.log('Using fallback suggestions data');
    const mockSuggestions = [
      {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        profilePicture: "https://demedia-backend.fly.dev/uploads/profiles/file-1760292243693-835944557.jpg",
        mutualConnections: 5,
        reason: "Mutual friends"
      },
      {
        id: 2,
        name: "Jane Smith",
        username: "janesmith",
        profilePicture: null,
        mutualConnections: 3,
        reason: "Popular in your area"
      },
      {
        id: 3,
        name: "Mike Johnson",
        username: "mikej",
        profilePicture: null,
        mutualConnections: 2,
        reason: "Similar interests"
      }
    ];

    return NextResponse.json(mockSuggestions);

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
