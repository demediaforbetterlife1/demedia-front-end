/**
 * Script to update all hardcoded fly.dev URLs to use the centralized backend config
 * Run with: node update-backend-urls.js
 */

const fs = require('fs');
const path = require('path');

const OLD_URL = 'https://demedia-backend.fly.dev';
const NEW_IMPORT = `import { BACKEND_URL } from "@/config/backend";`;

// Files to update
const filesToUpdate = [
  'src/app/api/posts/[id]/route.ts',
  'src/app/api/posts/[id]/like/route.ts',
  'src/app/api/posts/[id]/bookmark/route.ts',
  'src/app/api/posts/[id]/comments/route.ts',
  'src/app/api/comments/[id]/route.ts',
  'src/app/api/messages/[chatId]/route.ts',
  'src/app/api/stories/[id]/route.ts',
  'src/app/api/user/[id]/route.ts',
  'src/app/api/user/[id]/follow/route.ts',
  'src/app/api/user/[id]/unfollow/route.ts',
  'src/app/api/user/[id]/followers/route.ts',
  'src/app/api/user/[id]/following/route.ts',
  'src/app/api/users/username/[username]/route.ts',
  'src/app/api/users/[id]/followers/route.ts',
  'src/app/api/users/[id]/following/route.ts',
];

console.log('🔄 Updating backend URLs...\n');

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace hardcoded URLs
  if (content.includes(OLD_URL)) {
    content = content.replace(new RegExp(OLD_URL, 'g'), '${BACKEND_URL}');
    modified = true;
  }
  
  // Add import if not present and file was modified
  if (modified && !content.includes('@/config/backend')) {
    // Add import after the first import statement
    const importMatch = content.match(/^import .+;$/m);
    if (importMatch) {
      const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, insertPos) + '\n' + NEW_IMPORT + content.slice(insertPos);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  } else {
    console.log(`⏭️  Skipped ${file} (no changes needed)`);
  }
});

console.log('\n✨ Done!');
