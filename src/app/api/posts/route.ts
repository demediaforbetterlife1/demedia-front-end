import { NextResponse } from "next/server";

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
    return NextResponse.json({ success: true, data, debug });

  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error?.message || "Unknown error", debug: error },
      { status: 500 }
    );
  }
}