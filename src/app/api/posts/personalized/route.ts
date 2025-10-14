import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Personalized posts API called with userId:', userId, 'interests:', body.interests);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/posts/personalized', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      console.log('Backend personalized posts response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend personalized posts data received:', data.length, 'posts');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend personalized posts fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend not available for personalized posts, using fallback');
    }

    // Fallback: Return sample personalized posts data
    console.log('Using fallback personalized posts data');
    const samplePosts = [
      {
        id: 1,
        content: "This is a personalized sample post",
        title: "Personalized Post",
        likes: Math.floor(Math.random() * 150),
        comments: Math.floor(Math.random() * 40),
        liked: false,
        user: {
          id: 1,
          name: "Personalized User",
          username: "personalizeduser",
          profilePicture: null
        },
        author: {
          id: 1,
          name: "Personalized User",
          username: "personalizeduser",
          profilePicture: null
        },
        createdAt: new Date().toISOString()
      }
    ];

    console.log('Returning fallback personalized posts:', samplePosts.length, 'posts');
    return NextResponse.json(samplePosts);
  } catch (error) {
    console.error('Error fetching personalized posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
