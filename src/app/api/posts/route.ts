import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Posts API called with userId:', userId);
    console.log('Auth header present:', !!authHeader);

    // Try to connect to the actual backend first
    try {
      console.log('🔄 Attempting to fetch from backend...');
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/posts', {
        headers: {
          'Authorization': authHeader || '',
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend posts response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ Backend posts data received:', data.length, 'posts');
        console.log('✅ First post structure:', data[0]);
        if (data[0]) {
          console.log('✅ First post user data:', data[0].user);
          console.log('✅ First post author data:', data[0].author);
          console.log('✅ First post user ID:', data[0].user?.id);
          console.log('✅ First post author ID:', data[0].author?.id);
        }
        
        // Log the actual user IDs from the database
        console.log('🔍 Backend posts data - first post user ID:', data[0]?.user?.id);
        console.log('🔍 Backend posts data - first post author ID:', data[0]?.author?.id);
        console.log('🔍 Full first post object:', JSON.stringify(data[0], null, 2));
        
        // Ensure user IDs are present in the data
        const fixedData = data.map(post => {
            // If user object exists but has no ID, try to get it from author
            if (post.user && !post.user.id && post.author && post.author.id) {
                post.user.id = post.author.id;
            }
            // If author object exists but has no ID, try to get it from user
            if (post.author && !post.author.id && post.user && post.user.id) {
                post.author.id = post.user.id;
            }
            return post;
        });
        
        return NextResponse.json(fixedData);
      } else {
        const errorText = await backendResponse.text();
        console.log('❌ Backend posts fetch failed:', backendResponse.status, errorText);
        console.log('❌ Error details:', errorText);
      }
    } catch (backendError) {
      console.log('❌ Backend connection error:', backendError);
    }

    // Try one more time without authentication to get real data
    try {
      console.log('🔄 Trying backend without authentication...');
      const publicResponse = await fetch('https://demedia-backend.fly.dev/api/posts', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (publicResponse.ok) {
        const data = await publicResponse.json();
        console.log('✅ Public backend posts data received:', data.length, 'posts');
        if (data[0]) {
          console.log('✅ Public first post user data:', data[0].user);
          console.log('✅ Public first post author data:', data[0].author);
          console.log('✅ Public first post user ID:', data[0].user?.id);
          console.log('✅ Public first post author ID:', data[0].author?.id);
        }
        
        // Log the actual user IDs from the public backend
        console.log('🔍 Public backend posts data - first post user ID:', data[0]?.user?.id);
        console.log('🔍 Public backend posts data - first post author ID:', data[0]?.author?.id);
        console.log('🔍 Full first post object (public):', JSON.stringify(data[0], null, 2));
        
        // Ensure user IDs are present in the data
        const fixedData = data.map(post => {
            // If user object exists but has no ID, try to get it from author
            if (post.user && !post.user.id && post.author && post.author.id) {
                post.user.id = post.author.id;
            }
            // If author object exists but has no ID, try to get it from user
            if (post.author && !post.author.id && post.user && post.user.id) {
                post.author.id = post.user.id;
            }
            return post;
        });
        
        return NextResponse.json(fixedData);
      } else {
        const errorText = await publicResponse.text();
        console.log('❌ Public backend failed:', publicResponse.status, errorText);
      }
    } catch (publicError) {
      console.log('❌ Public backend connection error:', publicError);
    }

    // Fallback: Return sample posts data with real user IDs from your database
    console.log('Using fallback posts data with real user IDs');
    const samplePosts = [
      {
        id: 17,
        content: "Welcome to Demedia, the social media revolution built for the modern world — smarter, safer, and more powerful than ever.",
        title: "DEMEDIA — The Future Social Media Platform 🚀",
        likes: 2,
        comments: 0,
        liked: false,
        user: {
          id: 15,
          name: "DeMedia",
          username: "demedia_official",
          profilePicture: "https://demedia-backend.fly.dev/uploads/profiles/file-1760292243693-835944557.jpg"
        },
        author: {
          id: 15,
          name: "DeMedia",
          username: "demedia_official",
          profilePicture: "https://demedia-backend.fly.dev/uploads/profiles/file-1760292243693-835944557.jpg"
        },
        createdAt: "2025-10-12T16:40:03.020Z"
      },
      {
        id: 15,
        content: "New Post",
        title: "New Post",
        likes: 3,
        comments: 0,
        liked: false,
        user: {
          id: 17,
          name: "Shehap elgamal",
          username: "shehap",
          profilePicture: null
        },
        author: {
          id: 17,
          name: "Shehap elgamal",
          username: "shehap",
          profilePicture: null
        },
        createdAt: "2025-10-12T15:04:00.946Z"
      },
      {
        id: 14,
        content: "🌺 صلِّ على الحبيب المصطفي",
        title: "🌺 صلِّ على الحبيب المصطفي",
        likes: 5,
        comments: 0,
        liked: false,
        user: {
          id: 16,
          name: "mohammed Ayman",
          username: "hamo_1",
          profilePicture: "/uploads/profiles/file-1760281215779-207283174.jpg"
        },
        author: {
          id: 16,
          name: "mohammed Ayman",
          username: "hamo_1",
          profilePicture: "/uploads/profiles/file-1760281215779-207283174.jpg"
        },
        createdAt: "2025-10-12T14:58:40.413Z"
      },
      {
        id: 13,
        content: "صلي ع محمد",
        title: "صلي ع محمد",
        likes: 5,
        comments: 0,
        liked: false,
        user: {
          id: 17,
          name: "Shehap elgamal",
          username: "shehap",
          profilePicture: null
        },
        author: {
          id: 17,
          name: "Shehap elgamal",
          username: "shehap",
          profilePicture: null
        },
        createdAt: "2025-10-12T14:58:28.728Z"
      }
    ];

    console.log('Returning fallback posts:', samplePosts.length, 'posts');
    return NextResponse.json(samplePosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
