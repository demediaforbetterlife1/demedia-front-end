// src/app/api/user/[id]/follow/route.ts - SIMPLIFIED
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    console.log('Forwarding follow request to backend for user:', targetUserId);

    // Forward to backend - cookies will be automatically included
    const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${targetUserId}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This sends cookies
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.log('Backend follow failed:', backendResponse.status, errorText);
      return NextResponse.json({ error: 'Follow failed' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('Backend follow successful:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}