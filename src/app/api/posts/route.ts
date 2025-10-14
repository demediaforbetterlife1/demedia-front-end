import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    console.log('Posts API called with userId:', userId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/posts', {
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend posts response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend posts data received:', data.length, 'posts');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend posts fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend not available for posts, using fallback');
    }

    // Fallback: Return sample posts data
    console.log('Using fallback posts data');
    const samplePosts = [
      {
        id: 1,
        content: "This is a sample post from the fallback system",
        title: "Sample Post",
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50),
        liked: false,
        user: {
          id: 1,
          name: "Sample User",
          username: "sampleuser",
          profilePicture: null
        },
        author: {
          id: 1,
          name: "Sample User",
          username: "sampleuser",
          profilePicture: null
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        content: "Another sample post to test the system",
        title: "Test Post",
        likes: Math.floor(Math.random() * 200),
        comments: Math.floor(Math.random() * 30),
        liked: false,
        user: {
          id: 2,
          name: "Test User",
          username: "testuser",
          profilePicture: null
        },
        author: {
          id: 2,
          name: "Test User",
          username: "testuser",
          profilePicture: null
        },
        createdAt: new Date().toISOString()
      }
    ];

    console.log('Returning fallback posts:', samplePosts.length, 'posts');
    return NextResponse.json(samplePosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
