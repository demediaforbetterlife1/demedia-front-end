import { NextRequest, NextResponse } from "next/server";

/**
 * This is how Facebook/Instagram/Twitter handle user data in posts:
 * 1. Backend returns complete user objects with all fields (id, name, username, profilePicture, etc.)
 * 2. No hardcoded mappings - everything comes from database
 * 3. User IDs are always present in the response
 * 4. Profile pictures and cover photos are stored as URLs in the database
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('🔧 Backend Fix API: Ensuring proper user data structure');

    // Try to connect to the actual backend
    try {
      const backendResponse = await fetch('https://demedia-backend.fly.dev/api/posts', {
        headers: {
          'Authorization': authHeader || '',
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ Backend returned data:', data.length, 'posts');
        
        // Process each post to ensure proper user data structure
        const processedPosts = data.map((post: any) => {
          // Ensure user object has all required fields
          if (post.user) {
            post.user = {
              id: post.user.id || null,
              name: post.user.name || 'Unknown User',
              username: post.user.username || 'unknown',
              profilePicture: post.user.profilePicture || null,
              coverPhoto: post.user.coverPhoto || null,
              bio: post.user.bio || '',
              location: post.user.location || '',
              followersCount: post.user.followersCount || 0,
              followingCount: post.user.followingCount || 0,
              likesCount: post.user.likesCount || 0,
              subscriptionTier: post.user.subscriptionTier || null,
              isVerified: post.user.isVerified || false,
              createdAt: post.user.createdAt || new Date().toISOString()
            };
          }
          
          // Ensure author object has all required fields
          if (post.author) {
            post.author = {
              id: post.author.id || null,
              name: post.author.name || 'Unknown User',
              username: post.author.username || 'unknown',
              profilePicture: post.author.profilePicture || null,
              coverPhoto: post.author.coverPhoto || null,
              bio: post.author.bio || '',
              location: post.author.location || '',
              followersCount: post.author.followersCount || 0,
              followingCount: post.author.followingCount || 0,
              likesCount: post.author.likesCount || 0,
              subscriptionTier: post.author.subscriptionTier || null,
              isVerified: post.author.isVerified || false,
              createdAt: post.author.createdAt || new Date().toISOString()
            };
          }
          
          // Ensure both user and author have the same ID if one exists
          if (post.user?.id && post.author && !post.author.id) {
            post.author.id = post.user.id;
          }
          if (post.author?.id && post.user && !post.user.id) {
            post.user.id = post.author.id;
          }
          
          return post;
        });
        
        console.log('✅ Processed posts with proper user data structure');
        return NextResponse.json(processedPosts);
      } else {
        console.log('❌ Backend not available');
      }
    } catch (backendError) {
      console.log('❌ Backend connection error:', backendError);
    }

    // If backend is not available, return empty array
    console.log('⚠️ Backend not available, returning empty array');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error in backend fix API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
