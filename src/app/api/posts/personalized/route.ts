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
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      console.log('Backend personalized posts response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend personalized posts data received:', data.length, 'posts');
        
        // Fix missing user IDs in personalized posts
        const fixedData = await Promise.all(data.map(async (post: any) => {
          // If user exists but has no ID, fetch it from backend
          if (post.user && !post.user.id && post.user.username) {
            console.log('🔧 Missing user ID in personalized post, fetching from backend for username:', post.user.username);
            try {
              const userResponse = await fetch(`https://demedia-backend.fly.dev/api/users/username/${post.user.username}`, {
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                post.user.id = userData.id;
                console.log('✅ Got user ID from backend for personalized post:', userData.id);
              } else {
                // Fallback: Use known mapping for known users
                const knownUsers: { [key: string]: number } = {
                  'demedia_official': 15,
                  'hamo_1': 16,
                  'shehap': 17,
                  'brzily': 21
                };
                if (knownUsers[post.user.username]) {
                  post.user.id = knownUsers[post.user.username];
                  console.log('✅ Using fallback user ID for personalized post:', post.user.id);
                }
              }
            } catch (error) {
              console.log('⚠️ Could not fetch user ID for personalized post:', error);
            }
          }
          
          // If author exists but has no ID, fetch it from backend
          if (post.author && !post.author.id && post.author.username) {
            console.log('🔧 Missing author ID in personalized post, fetching from backend for username:', post.author.username);
            try {
              const userResponse = await fetch(`https://demedia-backend.fly.dev/api/users/username/${post.author.username}`, {
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                post.author.id = userData.id;
                console.log('✅ Got author ID from backend for personalized post:', userData.id);
              } else {
                // Fallback: Use known mapping for known users
                const knownUsers: { [key: string]: number } = {
                  'demedia_official': 15,
                  'hamo_1': 16,
                  'shehap': 17,
                  'brzily': 21
                };
                if (knownUsers[post.author.username]) {
                  post.author.id = knownUsers[post.author.username];
                  console.log('✅ Using fallback author ID for personalized post:', post.author.id);
                }
              }
            } catch (error) {
              console.log('⚠️ Could not fetch author ID for personalized post:', error);
            }
          }
          
          // Ensure both user and author have the same ID if one exists
          if (post.user?.id && post.author && !post.author.id) {
            post.author.id = post.user.id;
            post.author.name = post.author.name || post.user.name;
            post.author.username = post.author.username || post.user.username;
            post.author.profilePicture = post.author.profilePicture || post.user.profilePicture;
          }
          if (post.author?.id && post.user && !post.user.id) {
            post.user.id = post.author.id;
            post.user.name = post.user.name || post.author.name;
            post.user.username = post.user.username || post.author.username;
            post.user.profilePicture = post.user.profilePicture || post.author.profilePicture;
          }
          
          return post;
        }));
        
        return NextResponse.json(fixedData);
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
      },
      {
        id: 2,
        content: "Another personalized post based on your interests",
        title: "Interest-Based Post",
        likes: Math.floor(Math.random() * 200),
        comments: Math.floor(Math.random() * 35),
        liked: false,
        user: {
          id: 2,
          name: "Interest User",
          username: "interestuser",
          profilePicture: null
        },
        author: {
          id: 2,
          name: "Interest User",
          username: "interestuser",
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
