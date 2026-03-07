"use client";

import React, { useEffect, useState } from "react";
import MediaImage from "@/components/MediaImage";
import { ensureAbsoluteMediaUrl } from "@/utils/mediaUtils";

export default function DebugImagesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        console.log("Posts data:", data);
        setPosts(data.posts || data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch posts:", err);
        setLoading(false);
      });
  }, []);

  const testUrls = [
    "/uploads/test.jpg",
    "uploads/test.jpg", 
    "/images/default-post.svg",
    "/images/default-avatar.svg",
    "https://demedia-backend-production.up.railway.app/uploads/test.jpg",
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjhGQUZDIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzciIHI9IjE4IiBmaWxsPSIjQ0JENUUxIi8+CjxwYXRoIGQ9Ik0yMCA4MEM0MCA2MCA2MCA2MCA4MCA4MEgyMFoiIGZpbGw9IiNDQkQ1RTEiLz4KPC9zdmc+"
  ];

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test URLs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {testUrls.map((url, index) => (
            <div key={index} className="border p-4 rounded">
              <p className="text-sm mb-2 break-all">Original: {url}</p>
              <p className="text-sm mb-2 break-all">Fixed: {ensureAbsoluteMediaUrl(url) || "null"}</p>
              <MediaImage
                src={url}
                alt={`Test image ${index + 1}`}
                className="w-full h-32 object-cover border"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Posts from API</h2>
        {posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 5).map((post, index) => (
              <div key={post.id || index} className="border p-4 rounded">
                <h3 className="font-semibold">{post.title || "No title"}</h3>
                <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile Picture */}
                  <div>
                    <p className="text-sm font-medium">Profile Picture:</p>
                    <p className="text-xs break-all mb-2">
                      Original: {post.author?.profilePicture || "null"}
                    </p>
                    <p className="text-xs break-all mb-2">
                      Fixed: {ensureAbsoluteMediaUrl(post.author?.profilePicture) || "null"}
                    </p>
                    <MediaImage
                      src={post.author?.profilePicture}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                      fallbackSrc="/images/default-avatar.svg"
                    />
                  </div>

                  {/* Post Image */}
                  <div>
                    <p className="text-sm font-medium">Post Image:</p>
                    <p className="text-xs break-all mb-2">
                      Original: {post.imageUrl || post.imageUrls?.[0] || "null"}
                    </p>
                    <p className="text-xs break-all mb-2">
                      Fixed: {ensureAbsoluteMediaUrl(post.imageUrl || post.imageUrls?.[0]) || "null"}
                    </p>
                    <MediaImage
                      src={post.imageUrl || post.imageUrls?.[0]}
                      alt="Post image"
                      className="w-32 h-24 object-cover"
                      fallbackSrc="/images/default-post.svg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}