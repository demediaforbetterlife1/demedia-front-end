"use client";

import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/config/backend';
import CreateDeSnapWithEditor from '@/components/CreateDeSnapWithEditor';

export default function CreateDeSnapPage() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      // Get the token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Please log in to create a desnap');
      }

      const text = formData.get('text') as string;
      const visibility = formData.get('visibility') as string;
      const mediaFile = formData.get('media') as File | null;

      let videoUrl = '';
      let thumbnail = '';
      let duration = 0;

      // Step 1: Upload video if provided
      if (mediaFile) {
        console.log('Uploading media file:', mediaFile.name);
        
        const uploadFormData = new FormData();
        uploadFormData.append('video', mediaFile);
        uploadFormData.append('visibility', visibility);
        
        // Extract duration from metadata if available
        const metadata = formData.get('metadata');
        if (metadata) {
          try {
            const metadataObj = JSON.parse(metadata as string);
            duration = metadataObj.duration || 0;
            uploadFormData.append('duration', duration.toString());
          } catch (e) {
            console.warn('Failed to parse metadata:', e);
          }
        }

        const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/video`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: uploadFormData,
          credentials: 'include'
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload video');
        }

        const uploadData = await uploadResponse.json();
        videoUrl = uploadData.videoUrl;
        thumbnail = uploadData.thumbnailUrl || videoUrl;
        duration = uploadData.duration || duration;
        
        console.log('Video uploaded successfully:', { videoUrl, thumbnail, duration });
      }

      // Step 2: Create desnap with text and video URL
      const desnapData = {
        content: videoUrl || text, // Use video URL as content if available, otherwise use text
        text: text, // Add text field separately
        thumbnail: thumbnail || null,
        duration: duration,
        visibility: visibility || 'public'
      };

      console.log('Creating desnap with data:', desnapData);

      const createResponse = await fetch(`${BACKEND_URL}/api/desnaps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(desnapData),
        credentials: 'include'
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create desnap');
      }

      const result = await createResponse.json();
      console.log('Desnap created successfully:', result);

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
