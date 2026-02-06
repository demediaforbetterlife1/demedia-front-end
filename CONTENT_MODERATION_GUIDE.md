# Content Moderation System - DeMedia

## Overview
DeMedia implements a comprehensive content moderation system to ensure all content (posts, desnaps/reels, stories, profile pictures) meets community guidelines and remains family-friendly.

## What Gets Moderated

### 1. **Text Content**
- Post titles and descriptions
- DeSnap captions
- Story text
- Comments
- User bios
- Hashtags

### 2. **Image Content**
- Post images
- DeSnap thumbnails
- Story images
- Profile pictures
- Cover photos

### 3. **Video Content**
- DeSnaps (reels)
- Story videos
- Post videos

## Moderation Rules

### ❌ **Prohibited Content**

#### Sexual & Explicit Content
- Nudity or partial nudity
- Bikinis, lingerie, or revealing clothing
- Suggestive or provocative poses
- Sexual acts or references
- Adult content or pornography
- Explicit language or descriptions

#### Inappropriate Clothing
- See-through or transparent clothing
- Extremely revealing outfits
- Underwear as outerwear
- Clothing that exposes private areas
- Overly tight or form-fitting clothing that's suggestive

#### Inappropriate Behavior
- Dancing in a sexual or provocative manner
- Twerking or similar suggestive movements
- Poses that emphasize body parts inappropriately
- Gestures with sexual connotations

#### Hate Speech & Violence
- Hate speech or discrimination
- Violent content or threats
- Self-harm or suicide references
- Graphic violence or gore
- Weapons or dangerous items

#### Spam & Scams
- Promotional spam
- Phishing attempts
- Pyramid schemes
- Fake giveaways
- Excessive self-promotion

#### Profanity & Offensive Language
- Swear words and profanity
- Slurs and derogatory terms
- Offensive or insulting language
- Harassment or bullying

### ✅ **Allowed Content**

- Family-friendly photos and videos
- Modest and appropriate clothing
- Respectful and positive language
- Educational or informative content
- Creative and artistic expression (within guidelines)
- Personal moments and celebrations (appropriate)
- Nature, travel, and lifestyle content
- Hobbies and interests

## How Moderation Works

### Frontend Moderation (Client-Side)
1. **Immediate Validation**: Content is checked before upload
2. **Real-time Feedback**: Users get instant feedback if content is inappropriate
3. **Suggestions**: System provides guidance on how to fix issues
4. **Multiple Checks**: Text, images, and videos are all validated

### Backend Moderation (Server-Side)
1. **Double Verification**: All content is re-checked on the server
2. **AI-Powered**: Uses OpenAI moderation API when available
3. **Pattern Matching**: Detects prohibited words and patterns
4. **Image Analysis**: Analyzes images for inappropriate content
5. **Fallback System**: Multiple layers of protection

## Moderation Categories

### Text Moderation Checks:
- ✓ Profanity detection
- ✓ Hate speech detection
- ✓ Sexual content detection
- ✓ Spam detection
- ✓ Prohibited links detection
- ✓ Inappropriate formatting detection

### Image Moderation Checks:
- ✓ Nudity detection (skin tone analysis)
- ✓ Inappropriate clothing detection
- ✓ Sexual content detection
- ✓ Violence detection (red color analysis)
- ✓ File format validation
- ✓ File size validation

### Video Moderation Checks:
- ✓ Duration validation (max 60 seconds for DeSnaps)
- ✓ File size validation (max 50MB)
- ✓ Filename analysis
- ✓ Format validation
- ✓ Content preview analysis

## User Experience

### When Content is Rejected:
1. **Clear Explanation**: Users see exactly why content was rejected
2. **Specific Categories**: System identifies which rules were violated
3. **Helpful Suggestions**: Guidance on how to fix the issue
4. **No Penalties**: First-time violations result in rejection only
5. **Educational**: Users learn community guidelines

### Example Rejection Messages:
- "Content contains sexual or explicit material"
- "Image shows inappropriate or revealing clothing"
- "Content contains inappropriate language"
- "Video filename contains inappropriate content"

## Best Practices for Users

### ✅ DO:
- Wear modest and appropriate clothing
- Use respectful language
- Share positive and uplifting content
- Follow community guidelines
- Report inappropriate content you see

### ❌ DON'T:
- Post revealing or suggestive photos
- Use profanity or offensive language
- Share sexual or explicit content
- Wear bikinis, lingerie, or revealing outfits in photos
- Dance or pose in a provocative manner
- Include prohibited links or spam

## Technical Implementation

### Frontend (`contentModeration.ts`):
```typescript
// Validate before posting
const result = await contentModerationService.validateContent({
  text: postText,
  image: imageFile,
  video: videoFile
});

if (!result.isApproved) {
  // Show error with reason and suggestions
  alert(result.reason);
}
```

### Backend (`moderation.js`):
```javascript
// Middleware for all content endpoints
app.post('/api/posts', moderateText, moderateImage, createPost);
app.post('/api/desnaps', moderateText, moderateImage, createDeSnap);
app.post('/api/stories', moderateText, moderateImage, createStory);
```

## Moderation Thresholds

### Image Analysis:
- **Nudity**: Skin tone ratio > 40%
- **Inappropriate Clothing**: Skin tone ratio 25-40%
- **Sexual Content**: Skin tone ratio > 30%
- **Violence**: Red color ratio > 10%

### Text Analysis:
- **Profanity**: Exact word matching
- **Hate Speech**: Pattern and word matching
- **Spam**: Regex pattern matching
- **Sexual Content**: Keyword detection

## Future Enhancements

### Planned Features:
1. **AI-Powered Image Recognition**: Integration with Google Vision API or AWS Rekognition
2. **Machine Learning Models**: Custom-trained models for better accuracy
3. **User Reporting System**: Community-driven moderation
4. **Appeal Process**: Users can appeal false positives
5. **Reputation System**: Track user behavior over time
6. **Automated Warnings**: Progressive enforcement system

## Privacy & Security

- **No Content Storage**: Moderation happens in real-time, no content is stored for analysis
- **Client-Side First**: Most checks happen on user's device
- **Encrypted Transfer**: All content transfers are encrypted
- **No Third-Party Sharing**: Content is never shared with third parties for moderation

## Support

If you believe your content was incorrectly flagged:
1. Review the community guidelines
2. Modify your content according to suggestions
3. Try posting again
4. Contact support if issues persist

## Community Guidelines Summary

DeMedia is a family-friendly platform. We want everyone to feel safe and comfortable. Please:
- Be respectful and kind
- Dress modestly in photos and videos
- Use appropriate language
- Share positive content
- Report violations
- Help maintain a safe community

---

**Remember**: When in doubt, ask yourself: "Would I be comfortable showing this to my family?" If not, it probably doesn't belong on DeMedia.
