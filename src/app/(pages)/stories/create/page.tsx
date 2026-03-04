"use client";

import { useRouter } from 'next/navigation';
import CreateStoryWithEditor from '@/components/CreateStoryWithEditor';

export default function CreateStoryPage() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demedia-backend-production.up.railway.app';
      
      const response = await fetch(`${API_URL}/api/stories/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create story');
      }

      // Redirect to stories page
      router.push('/home');
    } catch (error: any) {
      console.error('Error creating story:', error);
      alert(error.message || 'Failed to create story. Please try again.');
      throw error;
    }
  };

  return (
    <CreateStoryWithEditor
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
