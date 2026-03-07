# CRITICAL: Old Backend Down - Media Files Inaccessible

## Problem
The old Fly.dev backend (`https://demedia-backend.fly.dev`) is returning **503 Service Unavailable** errors.

All videos and images stored there are currently inaccessible:
- ❌ Videos: `https://demedia-backend.fly.dev/uploads/videos/*.mp4`
- ❌ Images: `https://demedia-backend.fly.dev/uploads/profiles/*.jpg`

## Impact
- DeSnaps videos won't play
- Old profile pictures won't load
- Old post images won't display
- Any media uploaded before migration is lost

## Immediate Actions Needed

### Option 1: Restart Fly.dev Backend (Quick Fix)
```bash
# If you still have access to Fly.dev
fly apps list
fly apps restart demedia-backend

# Check status
fly status -a demedia-backend
```

### Option 2: Migrate Media to Railway (Recommended)

#### Step 1: Download Media from Fly.dev
```bash
# SSH into Fly.dev app
fly ssh console -a demedia-backend

# Create archive of uploads
cd /app
tar -czf uploads-backup.tar.gz uploads/

# Download to local
fly ssh sftp get uploads-backup.tar.gz
```

#### Step 2: Upload to Cloud Storage (Cloudinary)
```javascript
// Script to migrate files
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateFiles() {
  const uploadsDir = './uploads';
  const files = getAllFiles(uploadsDir);
  
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: 'demedia/migrated',
        resource_type: 'auto'
      });
      
      console.log(`✅ Migrated: ${file} -> ${result.secure_url}`);
      
      // Update database with new URL
      await updateDatabaseUrl(file, result.secure_url);
    } catch (error) {
      console.error(`❌ Failed: ${file}`, error);
    }
  }
}
```

#### Step 3: Update Database URLs
```sql
-- Update all old Fly.dev URLs to new Cloudinary URLs
UPDATE posts 
SET imageUrl = REPLACE(imageUrl, 
  'https://demedia-backend.fly.dev/uploads/', 
  'https://res.cloudinary.com/YOUR_CLOUD/image/upload/demedia/migrated/')
WHERE imageUrl LIKE 'https://demedia-backend.fly.dev%';

UPDATE desnaps 
SET content = REPLACE(content, 
  'https://demedia-backend.fly.dev/uploads/', 
  'https://res.cloudinary.com/YOUR_CLOUD/video/upload/demedia/migrated/')
WHERE content LIKE 'https://demedia-backend.fly.dev%';

UPDATE users 
SET profilePicture = REPLACE(profilePicture, 
  'https://demedia-backend.fly.dev/uploads/', 
  'https://res.cloudinary.com/YOUR_CLOUD/image/upload/demedia/migrated/')
WHERE profilePicture LIKE 'https://demedia-backend.fly.dev%';
```

### Option 3: Temporary Proxy (Quick Workaround)

Add a proxy in your Railway backend to forward requests to Fly.dev:

```javascript
// backend/src/routes/proxy.js
router.get('/legacy-media/*', async (req, res) => {
  const filePath = req.params[0];
  const flyUrl = `https://demedia-backend.fly.dev/uploads/${filePath}`;
  
  try {
    const response = await fetch(flyUrl);
    if (response.ok) {
      const buffer = await response.buffer();
      res.set('Content-Type', response.headers.get('content-type'));
      res.send(buffer);
    } else {
      res.status(404).send('Media not found');
    }
  } catch (error) {
    res.status(503).send('Legacy backend unavailable');
  }
});
```

Then update frontend to use proxy:
```javascript
// demedia/src/utils/imageUrlFixer.ts
if (cleanUrl.includes("demedia-backend.fly.dev")) {
  // Redirect to Railway proxy
  return cleanUrl.replace(
    "https://demedia-backend.fly.dev/uploads/",
    "https://demedia-backend-production.up.railway.app/legacy-media/"
  );
}
```

## Prevention for Future

### Use Cloud Storage from Day 1
- ✅ Cloudinary (recommended)
- ✅ AWS S3
- ✅ Google Cloud Storage

### Benefits:
- Persistent storage (survives backend restarts)
- CDN delivery (faster)
- Automatic backups
- No server disk space used
- Easy migration between backends

## Checking Fly.dev Status

```bash
# Check if app exists
fly apps list

# Check app status
fly status -a demedia-backend

# View logs
fly logs -a demedia-backend

# Check if app is suspended
fly apps info demedia-backend
```

## If Fly.dev App is Suspended

Fly.dev may have suspended the app due to:
- Inactivity
- Billing issues
- Resource limits exceeded

To reactivate:
```bash
fly apps resume demedia-backend
```

## Recommended Solution

1. **Immediate**: Set up Cloudinary account (15 minutes)
2. **Short-term**: Migrate existing media files (1-2 hours)
3. **Long-term**: Update all upload endpoints to use Cloudinary

This will ensure:
- ✅ All media is accessible
- ✅ Fast CDN delivery
- ✅ No dependency on backend server
- ✅ Automatic backups
- ✅ Easy scaling

## Cost Estimate

**Cloudinary Free Tier:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- **Cost: $0/month**

Perfect for your current needs!
