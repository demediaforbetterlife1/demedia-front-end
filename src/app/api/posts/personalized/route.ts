import { NextRequest, NextResponse } from "next/server";

/**
 * Personalized Posts API - Fetches personalized posts with complete user data from PostgreSQL database
 * This works exactly like Facebook/Instagram/Twitter - all data comes from database
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Personalized posts API called with userId:', userId, 'interests:', body.interests);

    // Fetch personalized posts directly from PostgreSQL database
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Fetch personalized posts with complete user data from PostgreSQL database
      const data = await prisma.post.findMany({
        where: {
          // Add your personalization logic here based on user interests, follows, etc.
          // For now, we'll fetch recent posts
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
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
        take: 20, // Limit to 20 posts
      });

      await prisma.$disconnect();
      
      console.log('✅ Fetched personalized posts from database:', data.length, 'posts');
      console.log('✅ First post user ID from database:', data[0]?.user?.id);
      return NextResponse.json(data);
    } catch (databaseError) {
      console.log('❌ Database connection error:', databaseError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching personalized posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}