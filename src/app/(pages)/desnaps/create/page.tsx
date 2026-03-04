"use client";

import { useRouter } from 'next/navigation';
import CreateDeSnapWithEditor from '@/components/CreateDeSnapWithEditor';

export default function CreateDeSnapPage() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demedia-backend-production.up.railway.app';
      
      const response = await fetch(`${API_URL}/api/desnaps/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create desnap');
      }

      // Redirect to desnaps page
      router.push('/desnaps');
    } catch (error: any) {
      console.error('Error creating desnap:', error);
      alert(error.message || 'Failed to create desnap. Please try again.');
      throw error;
    }
  };

  return (
    <CreateDeSnapWithEditor
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
