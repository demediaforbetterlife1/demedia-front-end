export interface DeSnap {
    id: number;
    content: string;
    thumbnail?: string;
    duration: number;
    visibility: 'public' | 'followers' | 'close_friends' | 'premium';
    createdAt: string;
    expiresAt: string;
    likes: number;
    comments: number;
    views: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    userId?: number;
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
}
