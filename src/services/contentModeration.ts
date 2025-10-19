// Content Moderation Service
export interface ModerationResult {
    isApproved: boolean;
    reason?: string;
    confidence?: number;
    suggestions?: string[];
}

export interface ImageModerationResult extends ModerationResult {
    containsNudity?: boolean;
    containsViolence?: boolean;
    containsHate?: boolean;
    containsSpam?: boolean;
}

export interface TextModerationResult extends ModerationResult {
    containsProfanity?: boolean;
    containsHate?: boolean;
    containsSpam?: boolean;
    isInappropriate?: boolean;
}

class ContentModerationService {
    // Bad words and inappropriate content patterns
    private profanityWords = [
        'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap',
        'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag', 'nigger',
        'whore', 'slut', 'bitch', 'bastard', 'son of a bitch'
    ];

    private hateWords = [
        'kill', 'murder', 'suicide', 'bomb', 'terrorist', 'hate',
        'racist', 'sexist', 'homophobic', 'discrimination'
    ];

    private spamPatterns = [
        /buy now/i, /click here/i, /free money/i, /win lottery/i,
        /earn \$/i, /make money/i, /get rich/i, /investment/i
    ];

    // Moderate text content (posts, comments, bios)
    async moderateText(content: string): Promise<TextModerationResult> {
        const lowerContent = content.toLowerCase();
        
        // Check for profanity
        const containsProfanity = this.profanityWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );

        // Check for hate speech
        const containsHate = this.hateWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );

        // Check for spam
        const containsSpam = this.spamPatterns.some(pattern => 
            pattern.test(content)
        );

        // Check for inappropriate content
        const isInappropriate = this.checkInappropriateContent(content);

        if (containsProfanity || containsHate || containsSpam || isInappropriate) {
            return {
                isApproved: false,
                reason: this.getRejectionReason(containsProfanity, containsHate, containsSpam, isInappropriate),
                containsProfanity,
                containsHate,
                containsSpam,
                isInappropriate,
                suggestions: this.getSuggestions(containsProfanity, containsHate, containsSpam, isInappropriate)
            };
        }

        return {
            isApproved: true,
            confidence: 0.9
        };
    }

    // Moderate image content (profile photos, DeSnap thumbnails)
    async moderateImage(imageFile: File): Promise<ImageModerationResult> {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);

                // Basic image analysis
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                const analysis = this.analyzeImageData(imageData);

                if (analysis.containsNudity || analysis.containsViolence || analysis.containsHate) {
                    resolve({
                        isApproved: false,
                        reason: this.getImageRejectionReason(analysis),
                        containsNudity: analysis.containsNudity,
                        containsViolence: analysis.containsViolence,
                        containsHate: analysis.containsHate,
                        suggestions: ['Please use appropriate content', 'Avoid explicit or violent imagery']
                    });
                } else {
                    resolve({
                        isApproved: true,
                        confidence: 0.8
                    });
                }
            };

            img.onerror = () => {
                resolve({
                    isApproved: false,
                    reason: 'Invalid image file',
                    suggestions: ['Please use a valid image format (JPG, PNG, GIF)']
                });
            };

            img.src = URL.createObjectURL(imageFile);
        });
    }

    // Moderate video content (DeSnaps)
    async moderateVideo(videoFile: File): Promise<ModerationResult> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                // Basic video validation
                const duration = video.duration;
                const size = videoFile.size;

                // Check video duration (max 60 seconds for DeSnaps)
                if (duration > 60) {
                    resolve({
                        isApproved: false,
                        reason: 'Video too long',
                        suggestions: ['DeSnaps must be 60 seconds or less']
                    });
                    return;
                }

                // Check file size (max 50MB)
                if (size > 50 * 1024 * 1024) {
                    resolve({
                        isApproved: false,
                        reason: 'File too large',
                        suggestions: ['Please use a smaller video file (max 50MB)']
                    });
                    return;
                }

                resolve({
                    isApproved: true,
                    confidence: 0.7
                });
            };

            video.onerror = () => {
                resolve({
                    isApproved: false,
                    reason: 'Invalid video file',
                    suggestions: ['Please use a valid video format (MP4, MOV, AVI)']
                });
            };

            video.src = URL.createObjectURL(videoFile);
        });
    }

    private checkInappropriateContent(content: string): boolean {
        // Check for excessive caps
        const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (capsRatio > 0.7 && content.length > 10) return true;

        // Check for excessive special characters
        const specialCharRatio = (content.match(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./]/g) || []).length / content.length;
        if (specialCharRatio > 0.3) return true;

        // Check for repetitive content
        const words = content.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        if (words.length > 10 && uniqueWords.size / words.length < 0.3) return true;

        return false;
    }

    private analyzeImageData(imageData: ImageData | undefined): {
        containsNudity: boolean;
        containsViolence: boolean;
        containsHate: boolean;
    } {
        if (!imageData) {
            return { containsNudity: false, containsViolence: false, containsHate: false };
        }

        // Basic color analysis for inappropriate content
        const { data } = imageData;
        let skinTonePixels = 0;
        let redPixels = 0;
        let totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detect skin tones
            if (this.isSkinTone(r, g, b)) {
                skinTonePixels++;
            }

            // Detect red (potential violence/blood)
            if (r > 150 && g < 100 && b < 100) {
                redPixels++;
            }
        }

        const skinToneRatio = skinTonePixels / totalPixels;
        const redRatio = redPixels / totalPixels;

        return {
            containsNudity: skinToneRatio > 0.3, // High skin tone ratio might indicate nudity
            containsViolence: redRatio > 0.1, // High red ratio might indicate violence
            containsHate: false // Would need more sophisticated analysis
        };
    }

    private isSkinTone(r: number, g: number, b: number): boolean {
        // Basic skin tone detection
        return r > 95 && g > 40 && b > 20 && 
               Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
               Math.abs(r - g) > 15 && r > g && r > b;
    }

    private getRejectionReason(profanity: boolean, hate: boolean, spam: boolean, inappropriate: boolean): string {
        if (profanity) return 'Content contains inappropriate language';
        if (hate) return 'Content contains hate speech or violence';
        if (spam) return 'Content appears to be spam';
        if (inappropriate) return 'Content is inappropriate';
        return 'Content does not meet community guidelines';
    }

    private getImageRejectionReason(analysis: any): string {
        if (analysis.containsNudity) return 'Image contains inappropriate content';
        if (analysis.containsViolence) return 'Image contains violent content';
        if (analysis.containsHate) return 'Image contains hateful content';
        return 'Image does not meet community guidelines';
    }

    private getSuggestions(profanity: boolean, hate: boolean, spam: boolean, inappropriate: boolean): string[] {
        const suggestions = [];
        
        if (profanity) {
            suggestions.push('Please avoid using profanity');
            suggestions.push('Use respectful language');
        }
        
        if (hate) {
            suggestions.push('Please avoid hate speech');
            suggestions.push('Be respectful to all users');
        }
        
        if (spam) {
            suggestions.push('Please avoid promotional content');
            suggestions.push('Share genuine content');
        }
        
        if (inappropriate) {
            suggestions.push('Please use appropriate content');
            suggestions.push('Follow community guidelines');
        }

        return suggestions;
    }
}

export const contentModerationService = new ContentModerationService();
