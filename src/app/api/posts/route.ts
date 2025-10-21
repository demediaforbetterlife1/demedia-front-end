export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Sending body:", body);

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": String(body.userId || ""),
        // لو الباك إند محتاج توكن، هنا تضيفه:
        // "Authorization": "Bearer YOUR_TOKEN_HERE",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log("Backend response text:", text);

    let backendResponse;
    try {
      backendResponse = JSON.parse(text);
    } catch {
      backendResponse = text;
    }

    return NextResponse.json(
      {
        status: res.status,
        ok: res.ok,
        sentBody: body,
        backendResponse,
      },
      { status: res.status }
    );
  } catch (error: any) {
    console.error("Error creating post:", error.message);
    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 }
    );
  }
}