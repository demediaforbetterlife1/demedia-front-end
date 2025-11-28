"use client";

import React, { useState } from "react";
import MediaImage from "./MediaImage";

interface ImageTestResult {
  url: string;
  status: "loading" | "success" | "error";
  error?: string;
  loadTime?: number;
}

export default function ImageDebugTest() {
  const [testResults, setTestResults] = useState<ImageTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testUrls = [
    // Test different URL formats that might be returned from backend
    "https://demedia-backend.fly.dev/uploads/posts/test-image.png",
    "/uploads/posts/test-image.png",
    "uploads/posts/test-image.png",
    "/images/default-post.svg",
    "/images/default-avatar.png",
    "https://via.placeholder.com/300x200.png?text=Test+Image",
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRhdGEgVVJMIFRlc3Q8L3RleHQ+PC9zdmc+",
  ];

  const testImage = async (url: string): Promise<ImageTestResult> => {
    const startTime = Date.now();
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          url,
          status: "success",
          loadTime: Date.now() - startTime,
        });
      };

      img.onerror = () => {
        resolve({
          url,
          status: "error",
          error: "Failed to load image",
          loadTime: Date.now() - startTime,
        });
      };

      // Set a timeout
      setTimeout(() => {
        if (img.complete === false) {
          resolve({
            url,
            status: "error",
            error: "Timeout after 10 seconds",
            loadTime: Date.now() - startTime,
          });
        }
      }, 10000);

      img.src = url;
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const url of testUrls) {
      const result = await testImage(url);
      setTestResults((prev) => [...prev, result]);
    }

    setIsRunning(false);
  };

  const testUpload = async () => {
    try {
      // Create a small test image
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Draw a simple test image
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(0, 0, 300, 200);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Test Upload", 150, 100);
        ctx.fillText(new Date().toLocaleTimeString(), 150, 130);
      }

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, "test-image.png");
        formData.append("type", "post");

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          const result = await response.json();
          console.log("Upload test result:", result);

          if (result.success && result.url) {
            // Test the uploaded image
            const testResult = await testImage(result.url);
            setTestResults((prev) => [
              ...prev,
              {
                ...testResult,
                url: `${result.url} (UPLOADED)`,
              },
            ]);
          }
        } catch (error) {
          console.error("Upload test failed:", error);
          setTestResults((prev) => [
            ...prev,
            {
              url: "UPLOAD TEST",
              status: "error",
              error: error instanceof Error ? error.message : "Upload failed",
            },
          ]);
        }
      }, "image/png");
    } catch (error) {
      console.error("Canvas test failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              Image Debug Test
            </h2>
            <p className="text-gray-600 mt-2">
              This tool tests image loading and identifies URL formatting issues
            </p>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isRunning ? "Running Tests..." : "Test Image URLs"}
              </button>

              <button
                onClick={testUpload}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Upload
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.status === "success"
                      ? "border-green-200 bg-green-50"
                      : result.status === "error"
                        ? "border-red-200 bg-red-50"
                        : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          result.status === "success"
                            ? "bg-green-500"
                            : result.status === "error"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="font-medium text-sm">
                        {result.status === "success"
                          ? "SUCCESS"
                          : result.status === "error"
                            ? "ERROR"
                            : "LOADING"}
                      </span>
                      {result.loadTime && (
                        <span className="text-xs text-gray-500">
                          ({result.loadTime}ms)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 break-all mb-2">
                      {result.url}
                    </div>

                    {result.error && (
                      <div className="text-xs text-red-600 mb-2">
                        Error: {result.error}
                      </div>
                    )}
                  </div>

                  <div className="relative h-32 bg-gray-100 rounded border overflow-hidden">
                    {result.status === "success" ? (
                      <MediaImage
                        src={result.url.replace(" (UPLOADED)", "")}
                        alt="Test image"
                        className="object-cover"
                        fill
                        onError={() =>
                          console.log("MediaImage error for:", result.url)
                        }
                        onLoad={() =>
                          console.log("MediaImage loaded:", result.url)
                        }
                      />
                    ) : result.status === "error" ? (
                      <div className="flex items-center justify-center h-full text-red-500">
                        <span className="text-xs">Failed to load</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {testResults.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Summary</h3>
                <div className="text-sm text-gray-600">
                  <div>Total tests: {testResults.length}</div>
                  <div className="text-green-600">
                    Successful:{" "}
                    {testResults.filter((r) => r.status === "success").length}
                  </div>
                  <div className="text-red-600">
                    Failed:{" "}
                    {testResults.filter((r) => r.status === "error").length}
                  </div>
                  <div className="text-yellow-600">
                    Loading:{" "}
                    {testResults.filter((r) => r.status === "loading").length}
                  </div>
                  {testResults.some((r) => r.loadTime) && (
                    <div>
                      Average load time:{" "}
                      {Math.round(
                        testResults
                          .filter((r) => r.loadTime)
                          .reduce((sum, r) => sum + (r.loadTime || 0), 0) /
                          testResults.filter((r) => r.loadTime).length,
                      )}
                      ms
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
