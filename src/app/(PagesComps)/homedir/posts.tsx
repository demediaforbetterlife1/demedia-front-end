"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Trending from "@/app/(PagesComps)/homedir/trending";
import Suggestions from "@/app/(PagesComps)/homedir/suggestions";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useNotifications } from "@/components/NotificationProvider";
import CommentModal from "@/components/CommentModal";
import ReportModal from "@/components/ReportModal";
import EditPostModal from "@/components/EditPostModal";
import PostWithYouTubeComments from "@/components/PostWithYouTubeComments";
import { apiFetch } from "@/lib/api";
import PremiumUserIndicator from "@/components/PremiumUserIndicator";

type PostType = {
    id: number;
    title?: string;
    content: string;
    likes: number;
    comments: number;
    liked?: boolean;
    bookmarked?: boolean;
    views?: number;
    user?: {
        id?: number;
        name?: string;
        username?: string;
        profilePicture?: string;
        subscriptionTier?: 'monthly' | 'quarterly' | 'semiannual' | null;
    };
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    imageUrl?: string;
    videoUrl?: string;
    images?: string[];
    videos?: string[];
    media?: {
        type: 'image' | 'video';
        url: string;
        thumbnail?: string;
    }[];
};

export default function Posts() {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const { user } = useAuth();
    const { t } = useI18n();
    const { showSuccess, showError } = useNotifications();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown && !(event.target as Element).closest('.dropdown')) {
                setShowDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    useEffect(() => {
        const abort = new AbortController();
        let retryCount = 0;
        const maxRetries = 3;

        async function fetchPosts() {
            try {
                setLoading(true);
                setError(null);

                // Use personalized content if user has interests, otherwise fallback to regular posts
                const userInterests = user?.interests || [];
                let data;
                
                if (userInterests.length > 0) {
                    try {
                        const response = await apiFetch('/api/posts/personalized', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ interests: userInterests })
                        });
                        data = await response.json();
                    } catch (error) {
                        console.log('Personalized posts failed, falling back to regular posts');
                        const response = await apiFetch('/api/posts');
                        data = await response.json();
                    }
                } else {
                    const response = await apiFetch('/api/posts');
                    data = await response.json();
                }

                console.log('📊 Posts data received:', data);
                console.log('📊 Data type:', typeof data);
                console.log('📊 Is array:', Array.isArray(data));
                
                // Ensure data is an array
                let postsArray: any[] = data;
                if (!Array.isArray(data)) {
                    console.log('📊 Data is not array, checking for posts property...');
                    if (data && Array.isArray(data.posts)) {
                        postsArray = data.posts;
                    } else if (data && Array.isArray(data.data)) {
                        postsArray = data.data;
                    } else {
                        console.log('📊 No posts array found, using empty array');
                        postsArray = [];
                    }
                }

                console.log('📊 Final posts array:', postsArray);
                console.log('📊 Posts count:', postsArray.length);
                
                // Ensure all posts have required fields
                const processedPosts = postsArray.map((post: any) => ({
                    ...post,
                    createdAt: post.createdAt || new Date().toISOString(),
                    author: {
                        id: post.author?.id || post.user?.id || 0,
                        name: post.author?.name || post.user?.name || 'Unknown User',
                        username: post.author?.username || post.user?.username || 'unknown',
                        profilePicture: post.author?.profilePicture || post.user?.profilePicture
                    }
                }));
                
                setPosts(processedPosts);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError('Failed to load posts');
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();

        return () => {
            abort.abort();
        };
    }, [user?.interests]);

    const handleLike = async (postId: number) => {
        try {
            const response = await apiFetch(`/api/posts/${postId}/like`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(prev => prev.map(p => 
                    p.id === postId 
                        ? { ...p, liked: data.liked, likes: data.likes }
                        : p
                ));
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleBookmark = async (postId: number) => {
        try {
            const response = await apiFetch(`/api/posts/${postId}/bookmark`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(prev => prev.map(p => 
                    p.id === postId 
                        ? { ...p, bookmarked: data.bookmarked }
                        : p
                ));
            }
        } catch (error) {
            console.error('Error bookmarking post:', error);
        }
    };

    const handleComment = (post: PostType) => {
        setSelectedPost(post);
        setShowCommentModal(true);
    };

    const handleReport = (post: PostType) => {
        setSelectedPost(post);
        setShowReportModal(true);
    };

    const handleDelete = async (postId: number) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await apiFetch(`/api/posts/${postId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
                showSuccess('Post Deleted', 'Your post has been deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showError('Error', 'Failed to delete post');
        }
    };

    const handleEdit = (post: PostType) => {
        setSelectedPost(post);
        setShowEditModal(true);
    };

    const handlePostUpdated = (updatedPost: PostType) => {
        setPosts(prev => prev.map(p => 
            p.id === updatedPost.id ? updatedPost : p
        ));
        setShowEditModal(false);
        setSelectedPost(null);
        showSuccess('Post Updated', 'Your post has been updated successfully');
    };

    const handleReportSubmitted = () => {
        setShowReportModal(false);
        setSelectedPost(null);
        showSuccess('Report Submitted', 'Thank you for your report');
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const handleShare = async (postId: number) => {
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const shareData = {
                title: 'Check out this post on DeMedia',
                text: post.content,
                url: `${window.location.origin}/post/${postId}`
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                showSuccess('Link Copied!', 'Post link copied to clipboard');
            }
        } catch (error: unknown) {
            console.error('Error sharing post:', error);
        }
    };

    if (loading) return <p className="text-center theme-text-muted mt-10">{t('posts.loading','Loading posts...')}</p>;
    if (error) return <p className="text-center text-red-400 mt-10">{t('posts.error','Error')}: {error}</p>;
    if (!posts.length) return <p className="text-center theme-text-muted mt-10">{t('posts.none','No posts yet.')}</p>;

    return (
        <div className="flex flex-col md:flex-row p-4 gap-6">
            {/* Feed Section */}
            <div className="flex-1 md:w-2/3 max-w-2xl mx-auto space-y-4">
                {posts.map((post) => (
                    <PostWithYouTubeComments
                        key={post.id}
                        post={post}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={(postId) => {
                            setPosts(prev => prev.filter(p => p.id !== postId));
                            showSuccess('Post Deleted', 'Your post has been deleted successfully');
                        }}
                    />
                ))}
            </div>

            {/* Sidebar for Large Screens */}
            <div className="hidden md:block md:w-1/3 space-y-4">
                <Trending />
                <div className="theme-bg-secondary rounded-2xl theme-shadow p-4">
                    <Suggestions />
                </div>
            </div>

            {/* Comment Modal */}
            {selectedPost && (
                <CommentModal
                    isOpen={showCommentModal}
                    onClose={() => {
                        setShowCommentModal(false);
                        setSelectedPost(null);
                    }}
                    postId={selectedPost.id}
                    postContent={selectedPost.content}
                    postAuthor={selectedPost.user?.name || 'Unknown'}
                />
            )}

            {/* Report Modal */}
            {selectedPost && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => {
                        setShowReportModal(false);
                        setSelectedPost(null);
                    }}
                    postId={selectedPost.id}
                    postAuthor={selectedPost.user?.name || 'Unknown'}
                    onReportSubmitted={handleReportSubmitted}
                />
            )}

            {/* Edit Post Modal */}
            {selectedPost && (
                <EditPostModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedPost(null);
                    }}
                    post={selectedPost}
                    onPostUpdated={handlePostUpdated}
                />
            )}
        </div>
    );
}