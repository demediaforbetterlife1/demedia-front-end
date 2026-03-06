import { NextRequest, NextResponse } from "next/server";

// GET - Fetch a single DeSnap
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deSnapId } = await params;

    // Get token from cookie or Authorization header
    let token = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps/${deSnapId}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Cookie': token ? `token=${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        return NextResponse.json({ 
          error: errorText || `Backend responded with ${response.status}` 
        }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('Backend connection failed:', backendError);
      return NextResponse.json({ 
        error: 'Backend connection failed' 
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Error fetching DeSnap:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch DeSnap' 
    }, { status: 500 });
  }
}

// DELETE - Delete a DeSnap (only by owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deSnapId } = await params;

    // Get token from cookie or Authorization header
    let token = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps/${deSnapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        return NextResponse.json({ 
          error: errorText || `Backend responded with ${response.status}` 
        }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('Backend connection failed:', backendError);
      return NextResponse.json({ 
        error: 'Backend connection failed' 
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Error deleting DeSnap:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete DeSnap' 
    }, { status: 500 });
  }
}
