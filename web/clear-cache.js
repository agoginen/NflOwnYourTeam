#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing React development cache...');

// Clear node_modules/.cache if it exists
const nodeModulesCache = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(nodeModulesCache)) {
  try {
    fs.rmSync(nodeModulesCache, { recursive: true, force: true });
    console.log('✅ Cleared node_modules/.cache');
  } catch (error) {
    console.log('⚠️  Could not clear node_modules/.cache:', error.message);
  }
}

// Clear build folder if it exists
const buildFolder = path.join(__dirname, 'build');
if (fs.existsSync(buildFolder)) {
  try {
    fs.rmSync(buildFolder, { recursive: true, force: true });
    console.log('✅ Cleared build folder');
  } catch (error) {
    console.log('⚠️  Could not clear build folder:', error.message);
  }
}

console.log('🎉 Cache clearing complete!');
console.log('💡 Tips for avoiding cache issues:');
console.log('   - Use incognito/private browsing mode for testing');
console.log('   - Open DevTools and check "Disable cache" in Network tab');
console.log('   - Use Ctrl+Shift+R (Cmd+Shift+R on Mac) for hard refresh');
console.log('   - Service worker is disabled in development mode');
