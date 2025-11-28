import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Extract token from cookies or Authorization header
    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("Upload API: No authentication token found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get("user-id");

    console.log("Upload API: Request details", {
      hasToken: !!token,
      userId,
      contentType: request.headers.get("content-type"),
    });

    if (!userId) {
      console.log("Upload API: No user ID found in headers");
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "post";

    console.log("Upload API: FormData parsed", {
      type,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!file) {
      console.log("Upload API: No file found in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/") && type !== "video") {
      console.log("Upload API: Invalid file type", file.type);
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log("Upload API: File too large", file.size);
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 },
      );
    }

    // Try to connect to the actual backend first
    try {
      const backendFormData = new FormData();
      backendFormData.append("userId", userId);

      // Route to appropriate backend endpoint based on type
      let backendEndpoint: string;
      let fieldName: string;

      if (type === "profile" || type === "cover") {
        backendEndpoint =
          (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
          "/api/upload/profile";
        fieldName = "file";
        backendFormData.append("type", type);
      } else if (type === "video") {
        backendEndpoint =
          (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
          "/api/upload/video";
        fieldName = "video";
      } else {
        // Default to post upload (for images)
        backendEndpoint =
          (process.env.BACKEND_URL || "https://demedia-backend.fly.dev") +
          "/api/upload/post";
        fieldName = "image";
      }

      backendFormData.append(fieldName, file);

      console.log("Upload API: Sending to backend", {
        endpoint: backendEndpoint,
        fieldName,
        fileName: file.name,
      });

      const backendResponse = await fetch(backendEndpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "user-id": userId,
        },
        body: backendFormData,
      });

      const responseText = await backendResponse.text();
      console.log("Upload API: Backend response", {
        status: backendResponse.status,
        responseText:
          responseText.substring(0, 200) +
          (responseText.length > 200 ? "..." : ""),
      });

      if (backendResponse.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log("Upload API: Backend upload successful", {
            success: data.success,
            url: data.url,
            filename: data.filename,
          });

          // Ensure the URL is properly formatted
          if (
            data.url &&
            !data.url.startsWith("http") &&
            !data.url.startsWith("data:")
          ) {
            const baseUrl =
              process.env.BACKEND_URL || "https://demedia-backend.fly.dev";
            data.url = data.url.startsWith("/")
              ? `${baseUrl}${data.url}`
              : `${baseUrl}/${data.url}`;
          }

          return NextResponse.json(data);
        } catch (parseError) {
          console.error(
            "Upload API: Failed to parse backend response",
            parseError,
          );
          return NextResponse.json(
            {
              error: "Invalid response from server",
              details: responseText,
            },
            { status: 500 },
          );
        }
      } else {
        console.log(
          "Upload API: Backend upload failed",
          backendResponse.status,
          responseText,
        );

        // Try to parse error response
        try {
          const errorData = JSON.parse(responseText);
          return NextResponse.json(
            {
              error: errorData.error || "Backend upload failed",
              details: errorData.details,
            },
            { status: backendResponse.status },
          );
        } catch (parseError) {
          return NextResponse.json(
            {
              error: "Backend upload failed",
              details: responseText,
            },
            { status: backendResponse.status },
          );
        }
      }
    } catch (backendError) {
      console.error("Upload API: Backend connection error", backendError);

      // For development/fallback: Convert to base64
      if (process.env.NODE_ENV === "development") {
        console.log("Upload API: Using development fallback (base64)");
        try {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const dataUrl = `data:${file.type};base64,${base64}`;

          const fallbackResponse = {
            success: true,
            url: dataUrl,
            imageUrl: dataUrl,
            filename: file.name,
            size: file.size,
            type: type,
            message: "File uploaded (development fallback)",
          };

          console.log("Upload API: Returning fallback response", {
            filename: file.name,
            size: file.size,
          });
          return NextResponse.json(fallbackResponse);
        } catch (fallbackError) {
          console.error("Upload API: Fallback failed", fallbackError);
        }
      }

      return NextResponse.json(
        {
          error: "Upload service unavailable",
          details:
            backendError instanceof Error
              ? backendError.message
              : "Unknown error",
        },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Upload API: Unexpected error", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
