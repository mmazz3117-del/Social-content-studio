# Social Studio v1.0 — GitHub Pages frontend

## Included in v1.0
- **More colorful, visual UI:** brighter section accents, icon tabs, friendlier cards and stronger mobile hierarchy.
- **Preserve Reality photo editing:** AI Recommended Edit applies non-generative crop/light/color changes in the browser, guided by the AI photo notes. It does not redraw products, labels, packaging, logos, or shelf contents.
- **Video upload beta:** upload one supported browser-playable video. Social Studio samples up to 3 frames locally and sends only those still frames for AI analysis; the original video stays on the device.
- **Compact mobile results:** Reel steps and photo notes are collapsible, with an Expand/Collapse control and sticky result tabs on mobile.
- **Plain-language directions:** Reel guidance avoids unexplained editing jargon and stays concise.
- **Safer post graphics:** overlay and business/location text wrap within the graphic safe area.
- **Recent Projects:** carries forward v0.8/v0.9 history, stores compressed project media to reduce phone storage pressure, and properly clears legacy history when requested.
- **Improved mixed photo/video labeling:** AI and the frontend now share an explicit media order so lead-image selection and frame references stay accurate.
- **Version visible on mobile:** v1.0 remains visible in the header.

## Upload to GitHub
Replace the files in the root of the existing Social-content-studio repository with:
- index.html
- styles.css
- app.js
- README.md
- vercel.json
- .gitignore

The Firebase functions should also be updated with the v1.0 standalone Firebase ZIP before testing the new video-aware generation flow.
