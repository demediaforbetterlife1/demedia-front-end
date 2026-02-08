import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Configure route to accept large files - DISABLE bodyParser for multipart/form-data
export const config = {
  api: {
    bodyParser: false, // CRITICAL: Disable bodyParser for FormData uploads
  },
};

// Increase max duration for video processing - Vercel allows up to 300s on Pro
export const maxDuration = 300; // 5 minutes

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const userId = req.headers.get("user-id") || "";

  const backendRes = await fetch(
    `https://demedia-backend.fly.dev/api/upload/video`,
    {
      method: "POST",
      headers: {
        authorization: auth,
        "user-id": userId,
        // ❗ لا تحط Content-Type
      },
      body: req.body, // 🔥 أهم سطر
      duplex: "half", // مطلوب في Node 18+
    } as any
  );

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: backendRes.headers,
  });
}

