"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Image, Video, FileText, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import PostWithYouTubeComments from "@/components/PostWithYouTubeComments";
import StoriesList from "@/components/StoriesList";
import CreateStoryModal from "@/app/layoutElementsComps/navdir/CreateStoryModal";

interface Post {
    id: number;
    content: string;
    title?: string;
    createdAt: string;
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
    likes: number;
    comments: number;
    isLiked?: boolean;
    imageUrl?: string;
    videoUrl?: string;
}

export default function ExampleFeaturesPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateStory, setShowCreateStory] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const response = await apiFetch('/api/posts');
            
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                console.error('Failed to fetch posts');
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostUpdated = (updatedPost: Post) => {
        setPosts(prev => prev.map(post => 
            post.id === updatedPost.id ? updatedPost : post
        ));
    };

    const handlePostDeleted = (postId: number) => {
        setPosts(prev => prev.filter(post => post.id !== postId));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center theme-bg-primary">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-cyan-400 text-lg">Loading features...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen theme-bg-primary">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">DeMedia Features Demo</h1>
                    <p className="text-gray-400">Experience YouTube-style comments, story management, and more!</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                                activeTab === 'posts' 
                                    ? 'bg-cyan-500 text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <MessageCircle size={16} />
                            <span>Posts with Comments</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('stories')}
                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                                activeTab === 'stories' 
                                    ? 'bg-cyan-500 text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <FileText size={16} />
                            <span>Stories</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'posts' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">Posts with YouTube-Style Comments</h2>
                                <div className="text-sm text-gray-400">
                                    Click "Live Comments" to see rotating comments
                                </div>
                            </div>
                            
                            {posts.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageCircle size={48} className="mx-auto text-gray-500 mb-4" />
                                    <p className="text-gray-400">No posts available</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <PostWithYouTubeComments
                                            key={post.id}
                                            post={post}
                                            onPostUpdated={handlePostUpdated}
                                            onPostDeleted={handlePostDeleted}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">Text Stories</h2>
                                <button
                                    onClick={() => setShowCreateStory(true)}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2"
                                >
                                    <FileText size={16} />
                                    <span>Create Story</span>
                                </button>
                            </div>
                            
                            <StoriesList />
                        </div>
                    )}
                </motion.div>

                {/* Feature Info */}
                <div className="mt-12 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">✨ New Features</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-cyan-400 mb-2">YouTube-Style Comments</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Comments rotate every 3 seconds</li>
                                <li>• Edit/delete your own comments</li>
                                <li>• Live comment counter</li>
                                <li>• Smooth animations</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-400 mb-2">Story Management</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Create text-based stories</li>
                                <li>• Delete your own stories</li>
                                <li>• 24-hour expiration</li>
                                <li>• View count tracking</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Story Modal */}
            <CreateStoryModal
                isOpen={showCreateStory}
                onClose={() => setShowCreateStory(false)}
            />
        </div>
    );
}
