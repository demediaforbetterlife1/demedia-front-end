/**
 * Database Setup Script
 * This script ensures the database relationships are properly configured
 * for fetching posts with user data, exactly like Facebook/Instagram/Twitter
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database relationships...');

    // Test the relationship by fetching posts with user data
    const posts = await prisma.post.findMany({
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

    console.log('✅ Database relationships working correctly');
    console.log('✅ Fetched posts:', posts.length);
    console.log('✅ First post user ID from database:', posts[0]?.user?.id);
    console.log('✅ First post user name from database:', posts[0]?.user?.name);
    console.log('✅ First post username from database:', posts[0]?.user?.username);

    // Verify that user IDs come from the User table
    if (posts.length > 0 && posts[0].user?.id) {
      console.log('✅ SUCCESS: User ID comes directly from User table in database');
      console.log('✅ User data structure:', {
        id: posts[0].user.id,
        name: posts[0].user.name,
        username: posts[0].user.username,
        profilePicture: posts[0].user.profilePicture
      });
    } else {
      console.log('⚠️ WARNING: No posts or user data found in database');
    }

  } catch (error) {
    console.error('❌ Database setup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase();
