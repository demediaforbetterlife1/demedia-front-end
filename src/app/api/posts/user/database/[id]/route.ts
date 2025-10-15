import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch user's posts with complete user data from PostgreSQL database
 * This is how social platforms handle user-specific posts
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    
    console.log('🔧 Database User Posts API: Fetching posts for user:', userId);
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Fetch user's posts with complete user data from PostgreSQL database
    const posts = await prisma.post.findMany({
      where: {
        userId: parseInt(userId), // Filter by user ID
      },
      include: {
        user: {
          select: {
            id: true,           // REAL user ID from database
            name: true,         // User's display name from database
            username: true,     // User's username from database
            profilePicture: true, // User's profile picture URL from database
            coverPhoto: true,   // User's cover photo URL from database
            bio: true,         // User's bio from database
            location: true,     // User's location from database
            followersCount: true, // User's followers count from database
            followingCount: true, // User's following count from database
            likesCount: true,  // User's likes count from database
            subscriptionTier: true, // User's subscription tier from database
            isVerified: true,  // User's verification status from database
            createdAt: true,   // User's creation date from database
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('✅ Fetched user posts from database:', posts.length, 'posts for user:', userId);
    console.log('✅ First post user ID from database:', posts[0]?.user?.id);
    
    // Process posts to ensure both user and author fields are populated
    const processedPosts = posts.map((post: any) => {
      // Both user and author should reference the same user data
      return {
        ...post,
        author: post.user, // Set author to same as user
        user: post.user,   // Keep user field
      };
    });

    return NextResponse.json({ posts: processedPosts });
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: 'Unable to fetch user posts from database'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
