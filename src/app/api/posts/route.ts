import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const debug: any = { step: "start", backendUrl };

    const res = await fetch(backendUrl, { cache: "no-store" });
    debug.status = res.status;
    debug.statusText = res.statusText;

    const text = await res.text();
    debug.responseText = text.slice(0, 300); // نعرض أول 300 حرف بس

    if (!res.ok) {
      return NextResponse.json({ error: true, message: "Backend returned error", debug }, { status: res.status });
    }

    const data = JSON.parse(text);
    debug.ok = true;
    // Return the posts array directly instead of wrapping it
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error", debug: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const backendUrl = 'https://demedia-backend.fly.dev/api/posts';
    const body = await request.json();
    const userId = request.headers.get('user-id');
    
    console.log('Creating post via backend:', { userId, body });

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId || '',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('Backend post creation failed:', res.status, text);
      return NextResponse.json({ error: true, message: "Backend returned error", status: res.status, response: text }, { status: res.status });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}