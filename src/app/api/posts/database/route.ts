import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This is how Facebook/Instagram/Twitter handle posts with user data:
 * 1. Posts are linked to users via foreign key (userId in Post table)
 * 2. Prisma includes/joins the user data automatically
 * 3. All user data comes directly from PostgreSQL database
 * 4. No hardcoded data, no mock data, no generated IDs
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('🔧 Database Posts API: Fetching posts with user data from PostgreSQL');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Fetch posts with complete user data from PostgreSQL database
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,           // This is the REAL user ID from database
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
        author: {
          select: {
            id: true,           // This is the REAL author ID from database
            name: true,         // Author's display name from database
            username: true,     // Author's username from database
            profilePicture: true, // Author's profile picture URL from database
            coverPhoto: true,   // Author's cover photo URL from database
            bio: true,         // Author's bio from database
            location: true,     // Author's location from database
            followersCount: true, // Author's followers count from database
            followingCount: true, // Author's following count from database
            likesCount: true,  // Author's likes count from database
            subscriptionTier: true, // Author's subscription tier from database
            isVerified: true,  // Author's verification status from database
            createdAt: true,   // Author's creation date from database
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('✅ Fetched posts from database:', posts.length, 'posts');
    console.log('✅ First post user ID from database:', posts[0]?.user?.id);
    console.log('✅ First post author ID from database:', posts[0]?.author?.id);
    
    // Ensure both user and author have the same data if they're the same person
    const processedPosts = posts.map((post: any) => {
      // If user and author are the same person, ensure they have the same data
      if (post.user?.id && post.author?.id && post.user.id === post.author.id) {
        post.author = { ...post.user };
      }
      
      return post;
    });

    return NextResponse.json(processedPosts);
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: 'Unable to fetch posts from database'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
