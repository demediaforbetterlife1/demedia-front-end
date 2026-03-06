# Privacy System Implementation

## Overview
Complete privacy system implementation for posts, stories, and desnaps with visibility controls.

## Privacy Levels

All content types (posts, stories, desnaps) support the following visibility levels:

### 1. Public
- **Who can see**: Everyone, including non-followers
- **Use case**: Content you want to share with the world
- **Profile visibility**: Visible to anyone viewing your profile

### 2. Followers
- **Who can see**: Only people who follow you
- **Use case**: Content for your followers only
- **Profile visibility**: Only visible to followers viewing your profile

### 3. Close Friends
- **Who can see**: Only users in your close friends list
- **Use case**: Personal content for close friends
- **Profile visibility**: Only visible to close friends viewing your profile

### 4. Only Me (Private)
- **Who can see**: Only you (the creator)
- **Use case**: Private drafts or personal content
- **Profile visibility**: Only visible when viewing your own profile

## API Implementation

### Posts API

#### GET `/api/posts`
Query parameters:
- `view`: 'all' | 'following' | 'public'
- `userId`: Profile user ID (for profile view)
- `viewerId`: Current user ID

**Backend Logic:**
```javascript
// Filter by visibility
if (view === 'public') {
  // Return only public posts
  posts = posts.filter(p => p.visibility === 'public');
} else if (view === 'following') {
  // Return posts from followed users based on visibility
  posts = posts.filter(p => {
    if (p.visibility === 'public') return true;
    if (p.visibility === 'followers' && isFollowing(viewerId, p.authorId)) return true;
    if (p.visibility === 'close_friends' && isCloseFriend(viewerId, p.authorId)) return true;
    if (p.visibility === 'only_me' && viewerId === p.authorId) return true;
    return false;
  });
}

// For profile view
if (userId) {
  if (userId === viewerId) {
    // Own profile: show all posts
    posts = posts.filter(p => p.authorId === userId);
  } else {
    // Other profile: filter by relationship
    posts = posts.filter(p => {
      if (p.authorId !== userId) return false;
      if (p.visibility === 'public') return true;
      if (p.visibility === 'followers' && isFollowing(viewerId, userId)) return true;
      if (p.visibility === 'close_friends' && isCloseFriend(viewerId, userId)) return true;
      return false;
    });
  }
}
```

#### GET `/api/posts/user/{userId}`
Query parameters:
- `viewerId`: Current user ID

**Backend Logic:**
```javascript
const posts = await Post.findAll({ where: { authorId: userId } });

if (userId === viewerId) {
  // Own profile: return all posts
  return posts;
} else {
  // Other profile: filter by visibility
  return posts.filter(p => {
    if (p.visibility === 'public') return true;
    if (p.visibility === 'followers' && isFollowing(viewerId, userId)) return true;
    if (p.visibility === 'close_friends' && isCloseFriend(viewerId, userId)) return true;
    return false;
  });
}
```

#### POST `/api/posts`
Body:
```json
{
  "content": "string",
  "visibility": "public" | "followers" | "close_friends" | "only_me",
  "imageUrls": ["string"],
  "videoUrl": "string"
}
```

### Stories API

#### GET `/api/stories`
Query parameters:
- `view`: 'following' | 'public'
- `userId`: Profile user ID (for profile view)
- `viewerId`: Current user ID

**Backend Logic:**
```javascript
// Filter expired stories
const now = new Date();
stories = stories.filter(s => new Date(s.expiresAt) > now);

// Filter by visibility
if (view === 'following') {
  stories = stories.filter(s => {
    if (s.visibility === 'public') return true;
    if (s.visibility === 'followers' && isFollowing(viewerId, s.authorId)) return true;
    if (s.visibility === 'close_friends' && isCloseFriend(viewerId, s.authorId)) return true;
    if (s.visibility === 'only_me' && viewerId === s.authorId) return true;
    return false;
  });
} else if (view === 'public') {
  stories = stories.filter(s => s.visibility === 'public');
}

// For profile view
if (userId) {
  if (userId === viewerId) {
    // Own profile: show all stories
    stories = stories.filter(s => s.authorId === userId);
  } else {
    // Other profile: only public stories
    stories = stories.filter(s => 
      s.authorId === userId && s.visibility === 'public'
    );
  }
}
```

#### GET `/api/stories/user/{userId}`
Query parameters:
- `viewerId`: Current user ID

**Backend Logic:**
```javascript
const now = new Date();
let stories = await Story.findAll({ 
  where: { 
    authorId: userId,
    expiresAt: { [Op.gt]: now }
  } 
});

if (userId === viewerId) {
  // Own profile: return all stories
  return stories;
} else {
  // Other profile: only public stories
  return stories.filter(s => s.visibility === 'public');
}
```

#### POST `/api/stories`
Body:
```json
{
  "content": "string",
  "visibility": "public" | "followers" | "close_friends" | "only_me",
  "durationHours": number,
  "settings": {
    "allowReactions": boolean,
    "allowComments": boolean,
    "showViewCount": boolean,
    "mood": "string",
    "tags": ["string"],
    "effects": ["string"]
  }
}
```

### DeSnaps API

#### GET `/api/desnaps`
Query parameters:
- `view`: 'all' | 'following' | 'public'
- `userId`: Profile user ID (for profile view)
- `viewerId`: Current user ID

**Backend Logic:**
```javascript
// Filter expired desnaps
const now = new Date();
desnaps = desnaps.filter(d => new Date(d.expiresAt) > now);

// Filter by visibility
if (view === 'public') {
  desnaps = desnaps.filter(d => d.visibility === 'public');
} else if (view === 'following') {
  desnaps = desnaps.filter(d => {
    if (d.visibility === 'public') return true;
    if (d.visibility === 'followers' && isFollowing(viewerId, d.authorId)) return true;
    if (d.visibility === 'close_friends' && isCloseFriend(viewerId, d.authorId)) return true;
    if (d.visibility === 'only_me' && viewerId === d.authorId) return true;
    return false;
  });
}

// For profile view
if (userId) {
  if (userId === viewerId) {
    // Own profile: show all desnaps
    desnaps = desnaps.filter(d => d.authorId === userId);
  } else {
    // Other profile: filter by relationship
    desnaps = desnaps.filter(d => {
      if (d.authorId !== userId) return false;
      if (d.visibility === 'public') return true;
      if (d.visibility === 'followers' && isFollowing(viewerId, userId)) return true;
      if (d.visibility === 'close_friends' && isCloseFriend(viewerId, userId)) return true;
      return false;
    });
  }
}
```

#### GET `/api/desnaps/user/{userId}`
Query parameters:
- `viewerId`: Current user ID

**Backend Logic:**
```javascript
const now = new Date();
let desnaps = await DeSnap.findAll({ 
  where: { 
    authorId: userId,
    expiresAt: { [Op.gt]: now }
  } 
});

if (userId === viewerId) {
  // Own profile: return all desnaps
  return desnaps;
} else {
  // Other profile: filter by visibility
  return desnaps.filter(d => {
    if (d.visibility === 'public') return true;
    if (d.visibility === 'followers' && isFollowing(viewerId, userId)) return true;
    if (d.visibility === 'close_friends' && isCloseFriend(viewerId, userId)) return true;
    return false;
  });
}
```

#### POST `/api/desnaps`
Body:
```json
{
  "content": "string",
  "visibility": "public" | "followers" | "close_friends" | "only_me",
  "durationHours": number,
  "mediaUrl": "string",
  "mediaType": "image" | "video"
}
```

## Database Schema

### Posts Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  visibility VARCHAR(20) DEFAULT 'public',
  author_id INTEGER REFERENCES users(id),
  image_urls TEXT[],
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stories Table
```sql
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  visibility VARCHAR(20) DEFAULT 'followers',
  duration_hours INTEGER DEFAULT 24,
  author_id INTEGER REFERENCES users(id),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

### DeSnaps Table
```sql
CREATE TABLE desnaps (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  visibility VARCHAR(20) DEFAULT 'public',
  duration_hours INTEGER DEFAULT 24,
  author_id INTEGER REFERENCES users(id),
  media_url TEXT,
  media_type VARCHAR(10),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

## Frontend Implementation

### Creating Content with Visibility
All creation modals should include a visibility selector:

```tsx
<select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
  <option value="public">Public - Everyone can see</option>
  <option value="followers">Followers - Only followers can see</option>
  <option value="close_friends">Close Friends - Only close friends</option>
  <option value="only_me">Only Me - Private</option>
</select>
```

### Displaying Content
Content should display a visibility badge:

```tsx
{post.visibility === 'public' && (
  <span className="badge badge-green">Public</span>
)}
{post.visibility === 'followers' && (
  <span className="badge badge-blue">Followers</span>
)}
{post.visibility === 'close_friends' && (
  <span className="badge badge-purple">Close Friends</span>
)}
{post.visibility === 'only_me' && (
  <span className="badge badge-gray">Only Me</span>
)}
```

## Testing Checklist

### Posts
- [ ] Create public post - verify everyone can see it
- [ ] Create followers-only post - verify only followers see it
- [ ] Create close friends post - verify only close friends see it
- [ ] Create only me post - verify only creator sees it
- [ ] View other profile - verify correct posts visible based on relationship
- [ ] View own profile - verify all posts visible

### Stories
- [ ] Create public story - verify everyone can see it (with ring)
- [ ] Create followers-only story - verify only followers see it
- [ ] Create close friends story - verify only close friends see it
- [ ] Create only me story - verify only creator sees it
- [ ] View other profile - verify only public stories visible
- [ ] View own profile - verify all stories visible

### DeSnaps
- [ ] Create public desnap - verify everyone can see it
- [ ] Create followers-only desnap - verify only followers see it
- [ ] Create close friends desnap - verify only close friends see it
- [ ] Create only me desnap - verify only creator sees it
- [ ] View other profile - verify correct desnaps visible
- [ ] View own profile - verify all desnaps visible

## Security Considerations

1. **Backend Validation**: Always validate visibility on the backend, never trust frontend
2. **Relationship Checks**: Verify following/close friend relationships before showing content
3. **Owner Checks**: Always allow content owners to see their own content
4. **Expiration**: Check expiration dates for stories and desnaps
5. **Authentication**: Require authentication for all content access

## Notes

- Privacy settings are enforced at the API level for security
- Frontend displays appropriate badges and filters
- Backend performs relationship checks (following, close friends)
- Expired content (stories, desnaps) is automatically filtered
- Content owners always see their own content regardless of visibility
