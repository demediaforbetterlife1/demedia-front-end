import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/posts/[postId]/reactions - Get reactions for a post
export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const postId = parseInt(params.postId);
        const userId = request.headers.get('user-id');

        if (!postId || isNaN(postId)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        // Get reaction counts
        const reactions = await prisma.reaction.groupBy({
            by: ['emoji'],
            where: { postId },
            _count: { emoji: true }
        });

        const counts: Record<string, number> = {};
        reactions.forEach(reaction => {
            counts[reaction.emoji] = reaction._count.emoji;
        });

        // Get user's reactions if userId provided
        let userReactions: Record<string, boolean> = {};
        if (userId) {
            const userReactionData = await prisma.reaction.findMany({
                where: { 
                    postId,
                    userId: parseInt(userId)
                },
                select: { emoji: true }
            });

            userReactionData.forEach(reaction => {
                userReactions[reaction.emoji] = true;
            });
        }

        return NextResponse.json({
            counts,
            userReactions,
            totalReactions: Object.values(counts).reduce((a, b) => a + b, 0)
        });

    } catch (error) {
        console.error('Error fetching reactions:', error);
        return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }
}

// POST /api/posts/[postId]/reactions - Add a reaction
export async function POST(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const postId = parseInt(params.postId);
        const userId = request.headers.get('user-id');
        const { emoji } = await request.json();

        if (!postId || isNaN(postId)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 401 });
        }

        if (!emoji) {
            return NextResponse.json({ error: 'Emoji required' }, { status: 400 });
        }

        const userIdInt = parseInt(userId);

        // Check if user already reacted with this emoji
        const existingReaction = await prisma.reaction.findFirst({
            where: {
                postId,
                userId: userIdInt,
                emoji
            }
        });

        if (existingReaction) {
            return NextResponse.json({ 
                error: 'Already reacted with this emoji',
                alreadyReacted: true 
            }, { status: 400 });
        }

        // Add the reaction
        const reaction = await prisma.reaction.create({
            data: {
                postId,
                userId: userIdInt,
                emoji,
                createdAt: new Date()
            }
        });

        // Get updated counts
        const reactions = await prisma.reaction.groupBy({
            by: ['emoji'],
            where: { postId },
            _count: { emoji: true }
        });

        const counts: Record<string, number> = {};
        reactions.forEach(r => {
            counts[r.emoji] = r._count.emoji;
        });

        return NextResponse.json({
            success: true,
            reaction,
            counts,
            totalReactions: Object.values(counts).reduce((a, b) => a + b, 0)
        });

    } catch (error) {
        console.error('Error adding reaction:', error);
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
    }
}

// DELETE /api/posts/[postId]/reactions - Remove a reaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const postId = parseInt(params.postId);
        const userId = request.headers.get('user-id');
        const { emoji } = await request.json();

        if (!postId || isNaN(postId)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 401 });
        }

        if (!emoji) {
            return NextResponse.json({ error: 'Emoji required' }, { status: 400 });
        }

        const userIdInt = parseInt(userId);

        // Remove the reaction
        const deletedReaction = await prisma.reaction.deleteMany({
            where: {
                postId,
                userId: userIdInt,
                emoji
            }
        });

        // Get updated counts
        const reactions = await prisma.reaction.groupBy({
            by: ['emoji'],
            where: { postId },
            _count: { emoji: true }
        });

        const counts: Record<string, number> = {};
        reactions.forEach(r => {
            counts[r.emoji] = r._count.emoji;
        });

        return NextResponse.json({
            success: true,
            deletedCount: deletedReaction.count,
            counts,
            totalReactions: Object.values(counts).reduce((a, b) => a + b, 0)
        });

    } catch (error) {
        console.error('Error removing reaction:', error);
        return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
    }
}
