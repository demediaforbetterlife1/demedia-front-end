class ContentService {
    private API_BASE: string;

    constructor() {
        this.API_BASE = "";
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const defaultHeaders: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;
        if (userId) defaultHeaders['user-id'] = userId;

        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {}
            throw new Error(errorMessage);
        }

        return response.json();
    }

    // Get personalized posts based on user interests
    async getPersonalizedPosts(userInterests: string[] = []): Promise<any[]> {
        try {
            const response = await this.makeRequest<any[]>('/api/posts/personalized', {
                method: 'POST',
                body: JSON.stringify({ interests: userInterests }),
            });
            return response;
        } catch (error) {
            console.error('Failed to fetch personalized posts:', error);
            // Fallback to regular posts if personalized fails
            return this.getPosts();
        }
    }

    // Get regular posts (fallback)
    async getPosts(): Promise<any[]> {
        return this.makeRequest<any[]>('/api/posts');
    }

    // Get personalized stories based on user interests
    async getPersonalizedStories(userInterests: string[] = []): Promise<any[]> {
        try {
            const response = await this.makeRequest<any[]>('/api/stories/personalized', {
                method: 'POST',
                body: JSON.stringify({ interests: userInterests }),
            });
            return response;
        } catch (error) {
            console.error('Failed to fetch personalized stories:', error);
            // Fallback to regular stories if personalized fails
            return this.getStories();
        }
    }

    // Get regular stories (fallback)
    async getStories(): Promise<any[]> {
        return this.makeRequest<any[]>('/api/stories');
    }

    // Get trending content based on user interests
    async getPersonalizedTrending(userInterests: string[] = []): Promise<any[]> {
        try {
            const response = await this.makeRequest<any[]>('/api/trending/personalized', {
                method: 'POST',
                body: JSON.stringify({ interests: userInterests }),
            });
            return response;
        } catch (error) {
            console.error('Failed to fetch personalized trending:', error);
            return this.getTrending();
        }
    }

    // Get regular trending (fallback)
    async getTrending(): Promise<any[]> {
        return this.makeRequest<any[]>('/api/trending');
    }

    // Get personalized suggestions based on user interests
    async getPersonalizedSuggestions(userInterests: string[] = []): Promise<any[]> {
        try {
            const response = await this.makeRequest<any[]>('/api/suggestions/personalized', {
                method: 'POST',
                body: JSON.stringify({ interests: userInterests }),
            });
            return response;
        } catch (error) {
            console.error('Failed to fetch personalized suggestions:', error);
            return this.getSuggestions();
        }
    }

    // Get regular suggestions (fallback)
    async getSuggestions(): Promise<any[]> {
        return this.makeRequest<any[]>('/api/suggestions');
    }

    // Get content by specific interest
    async getContentByInterest(interest: string): Promise<any[]> {
        return this.makeRequest<any[]>(`/api/content/interest/${encodeURIComponent(interest)}`);
    }

    // Get user's content preferences
    async getUserContentPreferences(): Promise<{
        interests: string[];
        age: number;
        language: string;
        contentTypes: string[];
    }> {
        return this.makeRequest<any>('/api/user/content-preferences');
    }

    // Update user's content preferences
    async updateUserContentPreferences(preferences: {
        interests?: string[];
        age?: number;
        language?: string;
        contentTypes?: string[];
    }): Promise<any> {
        return this.makeRequest<any>('/api/user/content-preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    // Like a post
    async likePost(postId: number): Promise<any> {
        return this.makeRequest<any>(`/api/posts/${postId}/like`, {
            method: 'POST',
        });
    }

    // Unlike a post
    async unlikePost(postId: number): Promise<any> {
        return this.makeRequest<any>(`/api/posts/${postId}/unlike`, {
            method: 'DELETE',
        });
    }

    // Comment on a post
    async commentOnPost(postId: number, content: string): Promise<any> {
        return this.makeRequest<any>(`/api/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    // Get post comments
    async getPostComments(postId: number): Promise<any[]> {
        return this.makeRequest<any[]>(`/api/posts/${postId}/comments`);
    }
}

export const contentService = new ContentService();
