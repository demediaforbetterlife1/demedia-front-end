import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch personalized posts with complete user data from PostgreSQL database
 * This is how social platforms handle personalized content
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    const body = await request.json();
    
    console.log('🔧 Database Personalized Posts API: Fetching personalized posts for user:', userId);
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    // Fetch personalized posts with complete user data from PostgreSQL database
    const posts = await prisma.post.findMany({
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
        author: {
          select: {
            id: true,           // REAL author ID from database
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
      take: 20, // Limit to 20 posts
    });

    console.log('✅ Fetched personalized posts from database:', posts.length, 'posts');
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
      message: 'Unable to fetch personalized posts from database'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
