'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

interface DeSnapCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onDeSnapCreated: (deSnap: any) => void;
}

export default function DeSnapCreator({ isOpen, onClose, onDeSnapCreated }: DeSnapCreatorProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [duration, setDuration] = useState(24);
    const [visibility, setVisibility] = useState('public');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id) {
            setError('You must be logged in to create a DeSnap');
            return;
        }

        if (!content.trim()) {
            setError('Content is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/desnaps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user.id.toString()
                },
                body: JSON.stringify({
                    content: content.trim(),
                    duration,
                    visibility,
                    userId: user.id
                })
            });

            console.log('DeSnap creation response status:', response.status);

            if (!response.ok) {
                let errorMessage = "Failed to create DeSnap";
                try {
                    const errorText = await response.text();
                    console.log('DeSnap creation error response:', errorText);
                    
                    // Try to parse as JSON
                    if (errorText.trim().startsWith('{')) {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } else {
                        errorMessage = `Server error: ${response.status} - ${errorText}`;
                    }
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            // Safe JSON parsing
            let newDeSnap;
            try {
                const responseText = await response.text();
                console.log('DeSnap creation response text:', responseText);
                
                if (!responseText.trim()) {
                    throw new Error('Empty response from server');
                }
                
                // Check if response is HTML (error page)
                if (responseText.trim().startsWith('<')) {
                    throw new Error('Server returned HTML error page. Please check your connection.');
                }
                
                newDeSnap = JSON.parse(responseText);
                console.log('DeSnap created successfully:', newDeSnap);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Invalid response from server. Please try again.');
            }
            onDeSnapCreated(newDeSnap);
            onClose();
            
            // Reset form
            setContent('');
            setDuration(24);
            setVisibility('public');
        } catch (err: any) {
            console.error('Error creating DeSnap:', err);
            setError(err.message || 'Failed to create DeSnap');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">📸 Create DeSnap</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl"
                    >
                        ✕
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Content *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's happening? Share a moment..."
                            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                            rows={3}
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Duration (seconds)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 24)}
                            min="1"
                            max="3600"
                            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Visibility
                        </label>
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                        >
                            <option value="public">Public</option>
                            <option value="followers">Followers Only</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                    
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Creating...</span>
                                </div>
                            ) : (
                                'Create DeSnap'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
