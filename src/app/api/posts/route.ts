import { NextRequest, NextResponse } from "next/server";

// Helper function to get user ID from backend by username
async function getUserByIdFromBackend(username: string, authHeader: string): Promise<number | null> {
  try {
    // First try the backend directly
    const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/username/${username}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    if (backendResponse.ok) {
      const userData = await backendResponse.json();
      console.log('✅ Got user ID from backend:', userData.id, 'for username:', username);
      return userData.id;
    }
    
    // If backend fails, try our internal API
    const internalResponse = await fetch(`/api/users/username/${username}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    if (internalResponse.ok) {
      const userData = await internalResponse.json();
      console.log('✅ Got user ID from internal API:', userData.id, 'for username:', username);
      return userData.id;
    }
  } catch (error) {
    console.log('Error fetching user ID from backend:', error);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Post creation request:', body);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      console.log('Backend post creation response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend post created:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend post creation failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend post creation connection error:', backendError);
    }

    // Fallback: Return error if backend is not available
    console.log('Backend not available for post creation');
    return NextResponse.json({ 
      error: 'Backend not available',
      message: 'Post creation requires backend connection'
    }, { status: 503 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
          console.log('🔍 Full first post object from backend:', JSON.stringify(data[0], null, 2));
        
        // Check if backend is returning user IDs properly
        console.log('🔍 Backend data analysis:');
        data.forEach((post: any, index: number) => {
          console.log(`Post ${index + 1}:`, {
            id: post.id,
            hasUser: !!post.user,
            hasAuthor: !!post.author,
            userId: post.user?.id,
            authorId: post.author?.id,
            userName: post.user?.name,
            authorName: post.author?.name,
            userUsername: post.user?.username,
            authorUsername: post.author?.username
          });
        });
        }
        
        // Log the actual user IDs from the database
        console.log('🔍 Backend posts data - first post user ID:', data[0]?.user?.id);
        console.log('🔍 Backend posts data - first post author ID:', data[0]?.author?.id);
        console.log('🔍 Full first post object:', JSON.stringify(data[0], null, 2));
        
        // Check if the backend is actually returning user IDs
        if (data.length > 0) {
            console.log('🔍 Backend data analysis:');
            console.log('  - First post has user object:', !!data[0].user);
            console.log('  - First post has author object:', !!data[0].author);
            console.log('  - First post user.id:', data[0].user?.id);
            console.log('  - First post author.id:', data[0].author?.id);
            console.log('  - First post user object keys:', data[0].user ? Object.keys(data[0].user) : 'No user object');
            console.log('  - First post author object keys:', data[0].author ? Object.keys(data[0].author) : 'No author object');
        }
        
        // Ensure user IDs are present in the data - preserve actual user data
        const fixedData = await Promise.all(data.map(async (post: any) => {
            console.log('🔧 Processing post:', post.id, 'user:', post.user, 'author:', post.author);
            
            // If we have user data but no ID, try to get it from the backend
            if (post.user && !post.user.id && (post.user.name || post.user.username)) {
                console.log('🔧 Post has user data but no ID, fetching from backend');
                const userId = await getUserByIdFromBackend(post.user.username || post.user.name, authHeader || '');
                if (userId) {
                    post.user.id = userId;
                    console.log('✅ Got user ID from backend:', userId);
                } else {
                    console.log('⚠️ Could not get user ID from backend for:', post.user.username || post.user.name);
                }
            }
            
            if (post.author && !post.author.id && (post.author.name || post.author.username)) {
                console.log('🔧 Post has author data but no ID, fetching from backend');
                const authorId = await getUserByIdFromBackend(post.author.username || post.author.name, authHeader || '');
                if (authorId) {
                    post.author.id = authorId;
                    console.log('✅ Got author ID from backend:', authorId);
                } else {
                    console.log('⚠️ Could not get author ID from backend for:', post.author.username || post.author.name);
                }
            }
            
            // Ensure both user and author objects have the same ID if one exists
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
            
            // If no user data exists, don't create fake data - let the backend handle this
            if ((!post.user?.id && !post.author?.id) && (!post.user?.name && !post.author?.name)) {
                console.log('⚠️ No user data at all for post:', post.id, '- this should be handled by backend');
                // Don't create fake user data - let the backend provide real data
            }
            
            console.log('🔧 Final post data:', {
                id: post.id,
                user: post.user,
                author: post.author
            });
            
            return post;
        }));
        
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
        
        // Ensure user IDs are present in the data - preserve actual user data
        const fixedData = data.map((post: any) => {
            console.log('🔧 Processing post (public):', post.id, 'user:', post.user, 'author:', post.author);
            
            // If we have user data but no ID, preserve the user info without assigning fake IDs
            if (post.user && !post.user.id && (post.user.name || post.user.username)) {
                console.log('🔧 Post has user data but no ID (public), preserving user info');
                // Don't assign fake IDs - let the backend handle this
                console.log('⚠️ User data exists but no ID (public) - this should be handled by backend');
            }
            
            if (post.author && !post.author.id && (post.author.name || post.author.username)) {
                console.log('🔧 Post has author data but no ID (public), preserving author info');
                // Don't assign fake IDs - let the backend handle this
                console.log('⚠️ Author data exists but no ID (public) - this should be handled by backend');
            }
            
            // Ensure both user and author objects have the same ID if one exists
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
            
            // If no user data exists, don't create fake data - let the backend handle this
            if ((!post.user?.id && !post.author?.id) && (!post.user?.name && !post.author?.name)) {
                console.log('⚠️ No user data at all for post (public):', post.id, '- this should be handled by backend');
                // Don't create fake user data - let the backend provide real data
            }
            
            console.log('🔧 Final post data (public):', {
                id: post.id,
                user: post.user,
                author: post.author
            });
            
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

    // Fallback: Return empty array if backend is not available
    console.log('Backend not available, returning empty posts array');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
