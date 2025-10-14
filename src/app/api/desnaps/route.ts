import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Since the backend doesn't have desnaps endpoint, return empty array
    // This is a workaround until the backend implements desnaps functionality
    const desnaps: any[] = [];
    
    return NextResponse.json(desnaps);
  } catch (error) {
    console.error('Error fetching desnaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('DeSnap creation request:', body);

    // Try to connect to the actual backend first
        try {
          const backendResponse = await fetch('https://demedia-backend.fly.dev/api/desnaps', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'user-id': userId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
          });

          console.log('Backend DeSnap response status:', backendResponse.status);
          console.log('Backend DeSnap response headers:', Object.fromEntries(backendResponse.headers.entries()));

          if (backendResponse.ok) {
            const responseText = await backendResponse.text();
            console.log('Backend DeSnap raw response:', responseText);
            
            // Check if response is valid JSON
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              const data = JSON.parse(responseText);
              console.log('Backend DeSnap created:', data);
              return NextResponse.json(data);
            } else {
              console.log('Backend returned non-JSON response:', responseText);
            }
          } else {
            const errorText = await backendResponse.text();
            console.log('Backend DeSnap creation failed:', backendResponse.status, errorText);
          }
        } catch (backendError) {
          console.log('Backend DeSnap connection error:', backendError);
        }

    // Fallback: Create a mock DeSnap
    console.log('Using fallback DeSnap creation');
    const mockDeSnap = {
      id: `desnap_${userId}_${Date.now()}`,
      content: body.content || 'New DeSnap',
      thumbnail: body.thumbnail || null,
      duration: body.duration || 0,
      visibility: body.visibility || 'public',
      views: 0,
      likes: 0,
      comments: 0,
      userId: parseInt(userId),
      createdAt: new Date().toISOString(),
      message: 'DeSnap created (fallback mode)'
    };

    return NextResponse.json(mockDeSnap);

  } catch (error) {
    console.error('Error creating DeSnap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}