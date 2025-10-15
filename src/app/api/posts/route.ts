import { NextRequest, NextResponse } from "next/server";

/**
 * Posts API - Fetches posts with complete user data from PostgreSQL database
 * This works exactly like Facebook/Instagram/Twitter - all data comes from database
 * Uses the backend's Prisma schema
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Creating new post:', body);

    // Import Prisma and create post in database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const newPost = await prisma.post.create({
      data: {
        content: body.content,
        title: body.title,
        userId: parseInt(userId || '0'),
        imageUrl: body.imageUrl,
        videoUrl: body.videoUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    await prisma.$disconnect();

    console.log('✅ Post created in database:', newPost.id);
    return NextResponse.json(newPost);
  } catch (error) {
    console.error('❌ Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Posts API called with userId:', userId);
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Fetch posts directly from PostgreSQL database (like Facebook/Instagram/Twitter)
    try {
      console.log('🔄 Fetching posts from PostgreSQL database...');
      
      // Import Prisma and fetch directly from database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Fetch posts with complete user data from PostgreSQL database
      const data = await prisma.post.findMany({
        include: {
          user: {
            select: {
              id: true,         
              name: true,        
              username: true,    
              profilePicture: true, // User's profile picture URL from database
              coverPhoto: true,   // User's cover photo URL from database
              bio: true,         // User's bio from database
              location: true,   
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

      console.log('✅ Fetched posts from database:', data.length, 'posts');
      console.log('✅ First post user ID from database:', data[0]?.user?.id);
      console.log('✅ First post user name from database:', data[0]?.user?.name);
      console.log('✅ First post username from database:', data[0]?.user?.username);
      
      // Database provides complete user data - no processing needed
      console.log('✅ Database provided complete user data - no processing needed');
      return NextResponse.json(data);
    } catch (databaseError) {
      console.log('❌ Database connection error:', databaseError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}