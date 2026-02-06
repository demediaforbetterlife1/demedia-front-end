// Content Moderation Service - Enhanced for comprehensive content filtering
export interface ModerationResult {
    isApproved: boolean;
    reason?: string;
    confidence?: number;
    suggestions?: string[];
    categories?: string[];
}

export interface ImageModerationResult extends ModerationResult {
    containsNudity?: boolean;
    containsViolence?: boolean;
    containsHate?: boolean;
    containsSpam?: boolean;
    containsInappropriateClothing?: boolean;
    containsSexualContent?: boolean;
}

export interface TextModerationResult extends ModerationResult {
    containsProfanity?: boolean;
    containsHate?: boolean;
    containsSpam?: boolean;
    isInappropriate?: boolean;
    containsSexualContent?: boolean;
}

class ContentModerationService {
    // Enhanced bad words and inappropriate content patterns
    private profanityWords = [
        'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap',
        'stupid', 'idiot', 'moron', 'retard', 'fag', 'nigger',
        'whore', 'slut', 'bastard', 'dick', 'pussy', 'cock', 'penis',
        'vagina', 'boobs', 'tits', 'ass', 'butt', 'sexy', 'horny'
    ];

    private hateWords = [
        'kill', 'murder', 'suicide', 'bomb', 'terrorist', 'hate',
        'racist', 'sexist', 'homophobic', 'discrimination', 'nazi',
        'genocide', 'rape', 'assault', 'abuse', 'violence'
    ];

    private sexualContentWords = [
        'sex', 'porn', 'nude', 'naked', 'bikini', 'lingerie', 'underwear',
        'strip', 'twerk', 'lap dance', 'erotic', 'suggestive', 'revealing',
        'seductive', 'provocative', 'sensual', 'intimate', 'xxx', 'nsfw',
        'onlyfans', 'adult content', 'explicit', 'sexual', 'arousing'
    ];

    private inappropriateClothingWords = [
        'bikini', 'lingerie', 'underwear', 'bra', 'panties', 'thong',
        'revealing outfit', 'see-through', 'transparent', 'sheer',
        'low cut', 'cleavage', 'mini skirt', 'short shorts', 'crop top'
    ];

    private spamPatterns = [
        /buy now/i, /click here/i, /free money/i, /win lottery/i,
        /earn \$/i, /make money/i, /get rich/i, /investment/i,
        /follow me/i, /check out my/i, /link in bio/i, /dm me/i
    ];

    private prohibitedDomains = [
        /pornhub/i, /xvideos/i, /xhamster/i, /redtube/i, /xnxx/i,
        /onlyfans/i, /chaturbate/i, /cam4/i, /stripchat/i
    ];

    // Moderate text content (posts, comments, bios)
    async moderateText(content: string): Promise<TextModerationResult> {
        const lowerContent = content.toLowerCase();
        const categories: string[] = [];
        
        // Check for profanity
        const containsProfanity = this.profanityWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );
        if (containsProfanity) categories.push('profanity');

        // Check for hate speech
        const containsHate = this.hateWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );
        if (containsHate) categories.push('hate speech');

        // Check for sexual content
        const containsSexualContent = this.sexualContentWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );
        if (containsSexualContent) categories.push('sexual content');

        // Check for inappropriate clothing mentions
        const containsInappropriateClothing = this.inappropriateClothingWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );
        if (containsInappropriateClothing) categories.push('inappropriate clothing');

        // Check for spam
        const containsSpam = this.spamPatterns.some(pattern => 
            pattern.test(content)
        );
        if (containsSpam) categories.push('spam');

        // Check for prohibited domains
        const containsProhibitedDomain = this.prohibitedDomains.some(domain => 
            domain.test(content)
        );
        if (containsProhibitedDomain) categories.push('prohibited links');

        // Check for inappropriate content patterns
        const isInappropriate = this.checkInappropriateContent(content);
        if (isInappropriate) categories.push('inappropriate format');

        if (containsProfanity || containsHate || containsSpam || isInappropriate || 
            containsSexualContent || containsInappropriateClothing || containsProhibitedDomain) {
            return {
                isApproved: false,
                reason: this.getRejectionReason(categories),
                containsProfanity,
                containsHate,
                containsSpam,
                isInappropriate,
                containsSexualContent,
                categories,
                suggestions: this.getSuggestions(categories)
            };
        }

        return {
            isApproved: true,
            confidence: 0.9,
            categories: ['clean']
        };
    }

    // Enhanced image moderation
    async moderateImage(imageFile: File): Promise<ImageModerationResult> {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);

                // Enhanced image analysis
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                const analysis = this.analyzeImageData(imageData);
                const categories: string[] = [];

                if (analysis.containsNudity) categories.push('nudity');
                if (analysis.containsViolence) categories.push('violence');
                if (analysis.containsHate) categories.push('hate symbols');
                if (analysis.containsInappropriateClothing) categories.push('inappropriate clothing');
                if (analysis.containsSexualContent) categories.push('sexual content');

                if (categories.length > 0) {
                    resolve({
                        isApproved: false,
                        reason: this.getImageRejectionReason(categories),
                        containsNudity: analysis.containsNudity,
                        containsViolence: analysis.containsViolence,
                        containsHate: analysis.containsHate,
                        containsInappropriateClothing: analysis.containsInappropriateClothing,
                        containsSexualContent: analysis.containsSexualContent,
                        categories,
                        suggestions: [
                            'Please use appropriate images',
                            'Avoid explicit, violent, or inappropriate content',
                            'Ensure clothing is modest and appropriate',
                            'Follow community guidelines for content'
                        ]
                    });
                } else {
                    resolve({
                        isApproved: true,
                        confidence: 0.8,
                        categories: ['clean']
                    });
                }
            };

            img.onerror = () => {
                resolve({
                    isApproved: false,
                    reason: 'Invalid image file',
                    categories: ['invalid file'],
                    suggestions: ['Please use a valid image format (JPG, PNG, GIF)']
                });
            };

            img.src = URL.createObjectURL(imageFile);
        });
    }

    // Enhanced video moderation
    async moderateVideo(videoFile: File): Promise<ModerationResult> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                const duration = video.duration;
                const size = videoFile.size;
                const categories: string[] = [];

                // Check video duration (max 60 seconds for DeSnaps)
                if (duration > 60) {
                    categories.push('too long');
                    resolve({
                        isApproved: false,
                        reason: 'Video too long',
                        categories,
                        suggestions: ['DeSnaps must be 60 seconds or less']
                    });
                    return;
                }

                // Check file size (max 50MB)
                if (size > 50 * 1024 * 1024) {
                    categories.push('too large');
                    resolve({
                        isApproved: false,
                        reason: 'File too large',
                        categories,
                        suggestions: ['Please use a smaller video file (max 50MB)']
                    });
                    return;
                }

                // Check filename for inappropriate content
                const filename = videoFile.name.toLowerCase();
                const hasInappropriateName = this.sexualContentWords.some(word => 
                    filename.includes(word.toLowerCase())
                ) || this.inappropriateClothingWords.some(word => 
                    filename.includes(word.toLowerCase())
                );

                if (hasInappropriateName) {
                    categories.push('inappropriate filename');
                    resolve({
                        isApproved: false,
                        reason: 'Video filename contains inappropriate content',
                        categories,
                        suggestions: ['Please rename your video file appropriately']
                    });
                    return;
                }

                resolve({
                    isApproved: true,
                    confidence: 0.7,
                    categories: ['clean']
                });
            };

            video.onerror = () => {
                resolve({
                    isApproved: false,
                    reason: 'Invalid video file',
                    categories: ['invalid file'],
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

        // Check for excessive emojis
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const emojiCount = (content.match(emojiRegex) || []).length;
        if (emojiCount > content.length * 0.3) return true;

        return false;
    }

    private analyzeImageData(imageData: ImageData | undefined): {
        containsNudity: boolean;
        containsViolence: boolean;
        containsHate: boolean;
        containsInappropriateClothing: boolean;
        containsSexualContent: boolean;
    } {
        if (!imageData) {
            return { 
                containsNudity: false, 
                containsViolence: false, 
                containsHate: false,
                containsInappropriateClothing: false,
                containsSexualContent: false
            };
        }

        const { data } = imageData;
        let skinTonePixels = 0;
        let redPixels = 0;
        let darkPixels = 0;
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

            // Detect dark colors (potential inappropriate content)
            if (r < 50 && g < 50 && b < 50) {
                darkPixels++;
            }
        }

        const skinToneRatio = skinTonePixels / totalPixels;
        const redRatio = redPixels / totalPixels;
        const darkRatio = darkPixels / totalPixels;

        // Enhanced detection thresholds
        const containsNudity = skinToneRatio > 0.4; // Very high skin tone ratio
        const containsInappropriateClothing = skinToneRatio > 0.25 && skinToneRatio <= 0.4; // Moderate skin tone
        const containsSexualContent = skinToneRatio > 0.3 || (skinToneRatio > 0.2 && darkRatio < 0.1);
        const containsViolence = redRatio > 0.1;
        const containsHate = false; // Would need more sophisticated analysis

        return {
            containsNudity,
            containsViolence,
            containsHate,
            containsInappropriateClothing,
            containsSexualContent
        };
    }

    private isSkinTone(r: number, g: number, b: number): boolean {
        // Enhanced skin tone detection
        return r > 95 && g > 40 && b > 20 && 
               Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
               Math.abs(r - g) > 15 && r > g && r > b;
    }

    private getRejectionReason(categories: string[]): string {
        if (categories.includes('sexual content')) return 'Content contains sexual or explicit material';
        if (categories.includes('inappropriate clothing')) return 'Content shows inappropriate or revealing clothing';
        if (categories.includes('nudity')) return 'Content contains nudity or explicit imagery';
        if (categories.includes('profanity')) return 'Content contains inappropriate language';
        if (categories.includes('hate speech')) return 'Content contains hate speech or violence';
        if (categories.includes('spam')) return 'Content appears to be spam';
        if (categories.includes('prohibited links')) return 'Content contains prohibited links';
        if (categories.includes('inappropriate format')) return 'Content format is inappropriate';
        return 'Content does not meet community guidelines';
    }

    private getImageRejectionReason(categories: string[]): string {
        if (categories.includes('nudity')) return 'Image contains nudity or explicit content';
        if (categories.includes('sexual content')) return 'Image contains sexual or suggestive content';
        if (categories.includes('inappropriate clothing')) return 'Image shows inappropriate or revealing clothing';
        if (categories.includes('violence')) return 'Image contains violent content';
        if (categories.includes('hate symbols')) return 'Image contains hateful content';
        return 'Image does not meet community guidelines';
    }

    private getSuggestions(categories: string[]): string[] {
        const suggestions: string[] = [];
        
        if (categories.includes('profanity')) {
            suggestions.push('Please avoid using profanity or offensive language');
        }
        
        if (categories.includes('hate speech')) {
            suggestions.push('Please avoid hate speech and be respectful to all users');
        }
        
        if (categories.includes('spam')) {
            suggestions.push('Please avoid promotional or spam content');
        }
        
        if (categories.includes('sexual content') || categories.includes('inappropriate clothing')) {
            suggestions.push('Please ensure content is appropriate and modest');
            suggestions.push('Avoid sexual, suggestive, or revealing content');
        }

        if (categories.includes('prohibited links')) {
            suggestions.push('Please remove prohibited links from your content');
        }

        suggestions.push('Follow our community guidelines');
        suggestions.push('Keep content family-friendly and respectful');

        return suggestions;
    }

    // Public method to check if content is appropriate before posting
    async validateContent(content: {
        text?: string;
        image?: File;
        video?: File;
    }): Promise<ModerationResult> {
        const results: ModerationResult[] = [];

        if (content.text) {
            const textResult = await this.moderateText(content.text);
            if (!textResult.isApproved) return textResult;
            results.push(textResult);
        }

        if (content.image) {
            const imageResult = await this.moderateImage(content.image);
            if (!imageResult.isApproved) return imageResult;
            results.push(imageResult);
        }

        if (content.video) {
            const videoResult = await this.moderateVideo(content.video);
            if (!videoResult.isApproved) return videoResult;
            results.push(videoResult);
        }

        return {
            isApproved: true,
            confidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length,
            categories: ['clean']
        };
    }
}

export const contentModerationService = new ContentModerationService();
