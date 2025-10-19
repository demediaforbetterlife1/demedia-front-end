import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Since the backend doesn't have chat endpoint, return empty array
    // This is a workaround until the backend implements chat functionality
    const conversations: any[] = [];
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
