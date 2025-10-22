import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo. In production, replace with database.
const reactionStore: Map<string, { counts: Record<string, number>; userReactions: Record<string, Set<string>> }> = new Map();

function getKey(postId: string) {
  return `post:${postId}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const key = getKey(postId);
  const entry = reactionStore.get(key);
  const counts = entry?.counts || {};
  // userReactions for current user only is not exposed in GET without auth context
  return NextResponse.json({ counts, userReactions: {} });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const emoji = body?.emoji as string;
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'emoji required' }, { status: 400 });
    }

    // Identify user from headers (set by apiFetch)
    const userId = request.headers.get('user-id') || 'anon';
    const key = getKey(postId);
    const entry = reactionStore.get(key) || { counts: {}, userReactions: {} };
    entry.counts[emoji] = (entry.counts[emoji] || 0) + 1;
    if (!entry.userReactions[userId]) entry.userReactions[userId] = new Set<string>();
    entry.userReactions[userId].add(emoji);
    reactionStore.set(key, entry);

    return NextResponse.json({ ok: true, counts: entry.counts, userReactions: Object.fromEntries(Object.entries(entry.userReactions).map(([uid, set]) => [uid, Array.from(set)])) });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const emoji = body?.emoji as string;
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'emoji required' }, { status: 400 });
    }

    const userId = request.headers.get('user-id') || 'anon';
    const key = getKey(postId);
    const entry = reactionStore.get(key);
    if (!entry) return NextResponse.json({ ok: true, counts: {}, userReactions: {} });

    if (entry.counts[emoji]) entry.counts[emoji] = Math.max(0, entry.counts[emoji] - 1);
    if (entry.userReactions[userId]) entry.userReactions[userId].delete(emoji);
    reactionStore.set(key, entry);

    return NextResponse.json({ ok: true, counts: entry.counts, userReactions: Object.fromEntries(Object.entries(entry.userReactions).map(([uid, set]) => [uid, Array.from(set)])) });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}


