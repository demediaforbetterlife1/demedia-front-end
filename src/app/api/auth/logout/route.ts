import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Logout request received');

    // Create response
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the token cookie
    response.cookies.delete('token');
    
    console.log('[API] Token cookie cleared');
    return response;
    
  } catch (error: any) {
    console.error('[API] Logout error:', error);
    return NextResponse.json(
      { 
        error: 'Logout failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
