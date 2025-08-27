# Cache Troubleshooting Guide

## 🐛 Cache Issues Fixed

This document explains the cache-related fixes implemented to resolve issues with React development, particularly in incognito mode.

## 🔧 What Was Fixed

### 1. Service Worker Configuration
- **Service workers are now disabled in development** (localhost)
- Only enabled in production to prevent cache conflicts during development
- Dynamic cache names based on environment and timestamp
- Development mode skips all caching strategies

### 2. React Query Cache Settings
- **Development**: Near-zero caching (`staleTime: 0`, `cacheTime: 1000ms`)
- **Production**: Normal caching (`staleTime: 5min`, `cacheTime: 10min`)
- Enabled `refetchOnWindowFocus` in development for fresh data

### 3. Development Proxy
- Added `setupProxy.js` with no-cache headers
- Proxies API requests to backend with cache-control headers
- Prevents browser from caching API responses in development

### 4. Cache Clearing Tools
- **Script**: `npm run clear-cache` - Clears node cache and build folders
- **Web Tool**: Visit `/clear-browser-cache.html` for interactive cache clearing
- **Commands**: `npm run start:fresh` - Clears cache before starting

## 🚀 How to Use

### For Developers

1. **Start with fresh cache:**
   ```bash
   cd web
   npm run start:fresh
   ```

2. **Clear cache manually:**
   ```bash
   cd web
   npm run clear-cache
   ```

3. **Use the web tool:**
   - Navigate to `http://localhost:3000/clear-browser-cache.html`
   - Click "Clear All Caches" button
   - Perform hard refresh

### For Testing

1. **Incognito/Private Mode:** 
   - `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
   - Starts with completely fresh cache

2. **Hard Refresh:**
   - `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Bypasses all browser cache

3. **DevTools Method:**
   - Open DevTools (`F12`)
   - Go to Network tab
   - Check "Disable cache"
   - Keep DevTools open while testing

## 🔍 Cache Behavior by Environment

### Development (localhost:3000)
- ❌ Service workers disabled
- ❌ Minimal React Query caching
- ❌ No-cache headers on all requests
- ✅ Fresh data on every request
- ✅ Window focus triggers refetch

### Production (deployed)
- ✅ Service workers enabled with smart caching
- ✅ React Query caching for performance
- ✅ Static asset caching
- ✅ API request caching with fallbacks

## 🛠️ Troubleshooting Steps

### If you still see cache issues:

1. **Check environment:**
   ```javascript
   console.log('Environment:', process.env.NODE_ENV);
   ```

2. **Clear all browser data:**
   - Chrome: `Ctrl+Shift+Delete`
   - Select "All time" and check all boxes

3. **Disable all caching:**
   - Open DevTools → Application tab
   - Storage section → Clear storage
   - Service Workers section → Unregister all

4. **Use the cache clearing tool:**
   - Visit `http://localhost:3000/clear-browser-cache.html`
   - Follow the interactive steps

5. **Manual service worker removal:**
   ```javascript
   // Run in browser console
   navigator.serviceWorker.getRegistrations().then(function(registrations) {
     for(let registration of registrations) {
       registration.unregister();
     }
   });
   ```

## 📁 Files Modified

- `web/src/index.js` - Service worker registration logic
- `web/public/sw.js` - Service worker caching behavior
- `web/src/setupProxy.js` - Development proxy with no-cache headers
- `web/package.json` - Cache clearing scripts
- `web/clear-cache.js` - Node.js cache clearing utility
- `web/public/clear-browser-cache.html` - Interactive cache clearing tool

## 💡 Best Practices

1. **Always use incognito mode** for testing new features
2. **Keep DevTools open** with cache disabled during development
3. **Run `npm run start:fresh`** when switching branches
4. **Use hard refresh** (`Ctrl+Shift+R`) when in doubt
5. **Check the cache clearing tool** if issues persist

## 🎯 What This Solves

- ✅ React development server cache issues
- ✅ Service worker interference in development
- ✅ Stale API responses during development
- ✅ Redux Persist state conflicts
- ✅ React Query cache staleness
- ✅ Static asset caching problems
- ✅ Incognito mode compatibility issues

The application should now work smoothly in both development and production environments with appropriate caching strategies for each!
