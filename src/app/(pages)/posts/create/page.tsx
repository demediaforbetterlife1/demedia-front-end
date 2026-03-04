"use client";

import { useRouter } from 'next/navigation';
import CreatePostWithEditor from '@/components/CreatePostWithEditor';

export default function CreatePostPage() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demedia-backend-production.up.railway.app';
      
      const response = await fetch(`${API_URL}/api/posts/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      // Redirect to home page
      router.push('/home');
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.message || 'Failed to create post. Please try again.');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CreatePostWithEditor
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
