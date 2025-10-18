import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('Test posts endpoint called');
    
    const body = await request.json();
    console.log('Test post data received:', body);

    // Create a mock post with the received data
    const mockPost = {
      id: Date.now(),
      title: body.title || null,
      content: body.content || '',
      userId: parseInt(body.userId || '1'),
      imageUrl: body.imageUrl || null,
      imageUrls: body.imageUrls || [],
      videoUrl: body.videoUrl || null,
      hashtags: body.hashtags || [],
      mentions: body.mentions || [],
      location: body.location || null,
      privacySettings: body.privacySettings || 'public',
      likes: 0,
      comments: 0,
      views: 0,
      liked: false,
      bookmarked: false,
      author: {
        id: parseInt(body.userId || '1'),
        name: 'Test User',
        username: 'testuser',
        profilePicture: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Created mock post:', mockPost);

    return NextResponse.json(mockPost);

  } catch (error) {
    console.error('Test posts error:', error);
    return NextResponse.json({ error: 'Test posts failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Test posts GET endpoint called');
    
    // Return a mock post with an image
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post with Image',
        content: 'This is a test post with an image',
        userId: 1,
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3QgSW1hZ2U8L3RleHQ+PC9zdmc+',
        imageUrls: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3QgSW1hZ2U8L3RleHQ+PC9zdmc+'],
        videoUrl: null,
        hashtags: ['#test', '#image'],
        mentions: [],
        location: null,
        privacySettings: 'public',
        likes: 5,
        comments: 2,
        views: 10,
        liked: false,
        bookmarked: false,
        author: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
          profilePicture: null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    console.log('Returning mock posts:', mockPosts);
    return NextResponse.json(mockPosts);

  } catch (error) {
    console.error('Test posts GET error:', error);
    return NextResponse.json({ error: 'Test posts GET failed' }, { status: 500 });
  }
}
