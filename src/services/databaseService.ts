// Database service to replace localStorage usage
// userId should be passed from AuthContext, not localStorage
class DatabaseService {
    private baseUrl: string;
    private token: string | null;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://demedia-backend.fly.dev';
        this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        // userId should come from AuthContext, not localStorage
    }

    private getHeaders(userId?: string | number) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (userId) {
            headers['user-id'] = String(userId);
        }
        
        return headers;
    }

    // Mood tracking methods
    async saveMood(mood: string, intensity: number, notes?: string) {
        try {
            const response = await fetch(`${this.baseUrl}/api/mood/record`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ mood, intensity, notes })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to save mood');
            }
        } catch (error) {
            console.error('Error saving mood:', error);
            throw error;
        }
    }

    async getMoodHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/api/mood/history`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load mood history');
            }
        } catch (error) {
            console.error('Error loading mood history:', error);
            throw error;
        }
    }

    async getMoodAnalytics() {
        try {
            const response = await fetch(`${this.baseUrl}/api/mood/analytics`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load mood analytics');
            }
        } catch (error) {
            console.error('Error loading mood analytics:', error);
            throw error;
        }
    }

    // Emotion tracking methods
    async saveEmotion(emotion: string, intensity: number, contentId?: string, contentType?: string, notes?: string) {
        try {
            const response = await fetch(`${this.baseUrl}/api/emotion/record`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ emotion, intensity, contentId, contentType, notes })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to save emotion');
            }
        } catch (error) {
            console.error('Error saving emotion:', error);
            throw error;
        }
    }

    async getEmotionHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/api/emotion/history`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load emotion history');
            }
        } catch (error) {
            console.error('Error loading emotion history:', error);
            throw error;
        }
    }

    async getEmotionAnalytics() {
        try {
            const response = await fetch(`${this.baseUrl}/api/emotion/analytics`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load emotion analytics');
            }
        } catch (error) {
            console.error('Error loading emotion analytics:', error);
            throw error;
        }
    }

    // User preferences methods
    async getUserPreferences() {
        try {
            const response = await fetch(`${this.baseUrl}/api/preferences`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load user preferences');
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
            throw error;
        }
    }

    async updateUserPreferences(preferences: any) {
        try {
            const response = await fetch(`${this.baseUrl}/api/preferences`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(preferences)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to update user preferences');
            }
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    // User analytics methods
    async getUserAnalytics() {
        try {
            const response = await fetch(`${this.baseUrl}/api/preferences/analytics`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load user analytics');
            }
        } catch (error) {
            console.error('Error loading user analytics:', error);
            throw error;
        }
    }

    // Activity logging
    async logActivity(activity: string, details?: any) {
        try {
            const response = await fetch(`${this.baseUrl}/api/preferences/activity`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ activity, details })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to log activity');
            }
        } catch (error) {
            console.error('Error logging activity:', error);
            throw error;
        }
    }

    // Migration helper - move localStorage data to database
    async migrateLocalStorageData() {
        try {
            if (typeof window === 'undefined') return;

            // Migrate mood history
            const moodHistory = localStorage.getItem('userMoodHistory');
            if (moodHistory) {
                const moods = JSON.parse(moodHistory);
                for (const mood of moods) {
                    await this.saveMood(mood.mood, mood.intensity, mood.notes);
                }
                localStorage.removeItem('userMoodHistory');
                console.log('✅ Migrated mood history to database');
            }

            // Migrate other localStorage data as needed
            // Add more migration logic here for other data types

        } catch (error) {
            console.error('Error migrating localStorage data:', error);
        }
    }
}

export const databaseService = new DatabaseService();
