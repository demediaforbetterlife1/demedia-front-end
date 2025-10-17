import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract current user id from JWT (server-safe)
    let currentUserId: string | null = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const part = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(part, 'base64').toString('utf-8'));
      currentUserId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
    } catch (_) {}

    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/${userId}/profile`, {
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId || request.headers.get('user-id') || '',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        if (data.profilePicture && typeof data.profilePicture === 'string' && !data.profilePicture.startsWith('http')) {
          data.profilePicture = `https://demedia-backend.fly.dev${data.profilePicture}`;
        }
        if (data.coverPhoto && typeof data.coverPhoto === 'string' && !data.coverPhoto.startsWith('http')) {
          data.coverPhoto = `https://demedia-backend.fly.dev${data.coverPhoto}`;
        }
        return NextResponse.json(data);
      }

      const text = await backendResponse.text();
      return NextResponse.json({ error: text || 'Failed to fetch profile' }, { status: backendResponse.status });
    } catch (_) {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    console.log("🔄 Updating profile for user:", userId, body);

    // تحديث المستخدم في قاعدة البيانات
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        username: body.username,
        bio: body.bio,
        profilePicture: body.profilePicture,
        coverPhoto: body.coverPhoto,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}