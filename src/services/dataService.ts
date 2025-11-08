"use client";

interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  dob?: string;
  age?: number;
  language?: string;
  preferredLang?: string;
  privacy?: string;
  interests?: string[];
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
  followers?: number;
  following?: number;
  posts?: number;
  isVerified?: boolean;
  joinedAt?: string;
}

interface Post {
  id: string;
  content: string;
  title?: string;
  author: User;
  images?: string[];
  videos?: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: User;
  receiver: User;
  createdAt: string;
  isRead: boolean;
  type: 'text' | 'image' | 'video' | 'file';
}

interface Story {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  expiresAt: string;
  views: number;
  type: 'image' | 'video';
}

class DataService {
  private API_BASE: string;

  constructor() {
    // Use same-origin relative API path; Next.js rewrite proxies to backend
    this.API_BASE = "";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    userId?: string | number
  ): Promise<T> {
    const token = localStorage.getItem('token');
    // userId should be passed from AuthContext, not localStorage

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    if (userId) {
      defaultHeaders['user-id'] = String(userId);
    }

    const response = await fetch(`${this.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // User related methods
  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/api/auth/me');
  }

  async getUserById(userId: string): Promise<User> {
    return this.makeRequest<User>(`/api/users/${userId}`);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return this.makeRequest<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async followUser(userId: string): Promise<void> {
    await this.makeRequest(`/api/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<void> {
    await this.makeRequest(`/api/users/${userId}/unfollow`, {
      method: 'POST',
    });
  }

  async getFollowers(userId: string): Promise<User[]> {
    return this.makeRequest<User[]>(`/api/users/${userId}/followers`);
  }

  async getFollowing(userId: string): Promise<User[]> {
    return this.makeRequest<User[]>(`/api/users/${userId}/following`);
  }

  // Post related methods
  async getPosts(page: number = 1, limit: number = 10): Promise<Post[]> {
    return this.makeRequest<Post[]>(`/api/posts?page=${page}&limit=${limit}`);
  }

  async getPostById(postId: string): Promise<Post> {
    return this.makeRequest<Post>(`/api/posts/${postId}`);
  }

  async createPost(postData: {
    title?: string;
    content: string;
    images?: File[];
    videos?: File[];
  }): Promise<Post> {
    const formData = new FormData();
    formData.append('content', postData.content);
    if (postData.title) formData.append('title', postData.title);
    
    postData.images?.forEach((image, index) => {
      formData.append(`images`, image);
    });
    
    postData.videos?.forEach((video, index) => {
      formData.append(`videos`, video);
    });

    return this.makeRequest<Post>('/api/posts', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async likePost(postId: string): Promise<void> {
    await this.makeRequest(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async unlikePost(postId: string): Promise<void> {
    await this.makeRequest(`/api/posts/${postId}/unlike`, {
      method: 'POST',
    });
  }

  async bookmarkPost(postId: string): Promise<void> {
    await this.makeRequest(`/api/posts/${postId}/bookmark`, {
      method: 'POST',
    });
  }

  async unbookmarkPost(postId: string): Promise<void> {
    await this.makeRequest(`/api/posts/${postId}/unbookmark`, {
      method: 'POST',
    });
  }

  async deletePost(postId: string): Promise<void> {
    await this.makeRequest(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async sharePost(postId: string, platform?: string): Promise<void> {
    await this.makeRequest(`/api/posts/${postId}/share`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  }

  // Comment related methods
  async getComments(postId: string): Promise<Comment[]> {
    return this.makeRequest<Comment[]>(`/api/posts/${postId}/comments`);
  }

  async createComment(postId: string, content: string): Promise<Comment> {
    return this.makeRequest<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async likeComment(commentId: string): Promise<void> {
    await this.makeRequest(`/api/comments/${commentId}/like`, {
      method: 'POST',
    });
  }
 
  async deleteComment(commentId: string): Promise<void> {
    await this.makeRequest(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Message related methods
  async getMessages(chatId: string): Promise<Message[]> {
    return this.makeRequest<Message[]>(`/api/messages/${chatId}`);
  }

  async sendMessage(chatId: string, content: string, type: Message['type'] = 'text'): Promise<Message> {
    return this.makeRequest<Message>(`/api/messages/${chatId}`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  async getChats(): Promise<{ id: string; user: User; lastMessage: Message; unreadCount: number }[]> {
    return this.makeRequest(`/api/chat`);
  }

  // Story related methods
  async getStories(): Promise<Story[]> {
    return this.makeRequest<Story[]>('/api/stories');
  }

  async createStory(content: File, type: 'image' | 'video'): Promise<Story> {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('type', type);

    return this.makeRequest<Story>('/api/stories', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async viewStory(storyId: string, userId?: string | number): Promise<void> {
    try {
      // userId should be passed from AuthContext, not localStorage
      await this.makeRequest(`/api/stories/${storyId}/view`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: {
          'Content-Type': 'application/json',
        },
      }, userId);
    } catch (err) {
      // Backend may not implement this endpoint yet; fail silently
      console.warn('viewStory not supported by backend, ignoring');
    }
  }

  // Search methods
  async searchUsers(query: string): Promise<User[]> {
    return this.makeRequest<User[]>(`/api/search/users?q=${encodeURIComponent(query)}`);
  }

  async searchPosts(query: string): Promise<Post[]> {
    return this.makeRequest<Post[]>(`/api/search/posts?q=${encodeURIComponent(query)}`);
  }

  // Notification methods
  async getNotifications(): Promise<any[]> {
    return this.makeRequest('/api/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.makeRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.makeRequest('/api/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Trending and suggestions
  async getTrendingHashtags(): Promise<{ tag: string; count: number }[]> {
    return this.makeRequest('/api/trending/hashtags');
  }

  async getSuggestedUsers(): Promise<User[]> {
    return this.makeRequest<User[]>('/api/suggestions/users');
  }

  async getSuggestedPosts(): Promise<Post[]> {
    return this.makeRequest<Post[]>('/api/suggestions/posts');
  }

  // Analytics
  async getPostAnalytics(postId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
  }> {
    return this.makeRequest(`/api/posts/${postId}/analytics`);
  }

  async getUserAnalytics(userId: string): Promise<{
    totalPosts: number;
    totalFollowers: number;
    totalFollowing: number;
    totalLikes: number;
    engagementRate: number;
  }> {
    return this.makeRequest(`/api/users/${userId}/analytics`);
  }
}

// Create singleton instance
export const dataService = new DataService();

// Export for use in components
export default dataService;
