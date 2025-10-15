import { NextRequest, NextResponse } from "next/server";

/**
 * User Posts API - Fetches user's posts with complete user data from PostgreSQL database
 * This works exactly like Facebook/Instagram/Twitter - all data comes from database
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    
    console.log('User posts API called for user:', userId);
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Fetch user's posts directly from PostgreSQL database
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
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

      await prisma.$disconnect();
      
      console.log('✅ Fetched user posts from database:', posts.length, 'posts for user:', userId);
      console.log('✅ First post user ID from database:', posts[0]?.user?.id);
      return NextResponse.json({ posts });
    } catch (databaseError) {
      console.log('❌ Database connection error:', databaseError);
      return NextResponse.json({ posts: [] });
    }
  } catch (error) {
    console.error('❌ Error fetching user posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}