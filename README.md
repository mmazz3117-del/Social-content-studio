# Social Media Pal v2.0 — Content Director

Social Media Pal is now a mobile-first content planning and directing companion.

Instead of trying to automatically edit videos in the browser, Pal creates the concept, shot list, camera directions, timing, assembly roadmap, on-screen text and copy-ready publish kit. Optional uploaded photos/videos are used for visual analysis only.

## GitHub Pages deployment
Replace the existing frontend files with the contents of this package. The key changed files are:
- index.html
- app.js
- styles.css

No Firebase Functions deployment is required for this version. It continues using the existing `generateSocialPackage` callable function in `us-central1`.
