#!/usr/bin/env node

/**
 * Pre-build script to update version.json with fresh build information
 * This ensures every build has a unique identifier for cache busting
 */

const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, '../public/version.json');

const versionData = {
  version: "1.0.1",
  buildTime: new Date().toISOString(),
  buildId: `build-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  cachePolicy: "no-store",
  environment: process.env.NODE_ENV || "production",
  logo: "/assets/images/head.png",
  cacheBuster: true,
  timestamp: Date.now()
};

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

console.log('✅ Version file updated:', versionData.buildId);
console.log('📅 Build time:', versionData.buildTime);
console.log('🚀 Environment:', versionData.environment);
