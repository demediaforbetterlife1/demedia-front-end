"use client";
import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  author?: {
    name: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts from our Next.js API (which connects to backend)
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      const data = await res.json();

      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data.posts) {
        setPosts(data.posts);
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <p className="text-center mt-6">Loading posts...</p>;

  if (posts.length === 0)
    return <p className="text-center mt-6">No posts yet.</p>;

  return (
    <div className="flex flex-col gap-4 p-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border border-gray-700 rounded-2xl p-4 shadow-md bg-gray-900"
        >
          <div className="flex items-center gap-3 mb-2">
            {post.author?.profilePicture && (
              <img
                src={post.author.profilePicture}
                alt={post.author.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold">{post.author?.name}</p>
              <p className="text-sm text-gray-400">@{post.author?.username}</p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-2">{post.title}</h2>
          <p className="mb-2">{post.content}</p>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post Image"
              className="rounded-xl mt-2 w-full"
            />
          )}

          <p className="text-xs text-gray-500 mt-2">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}