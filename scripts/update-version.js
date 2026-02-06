#!/usr/bin/env node

/**
 * Update version.json with current build timestamp
 * This ensures every build has a unique version identifier
 */

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../public/version.json');

const version = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  buildId: `build-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  cachePolicy: 'no-store',
  environment: process.env.NODE_ENV || 'development'
};

fs.writeFileSync(versionFile, JSON.stringify(version, null, 2));

console.log('✅ Version file updated:', version);
console.log('📦 Build ID:', version.buildId);
console.log('🕐 Build Time:', version.buildTime);
