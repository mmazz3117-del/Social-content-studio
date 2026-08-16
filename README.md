# Social Studio v0.5 (GitHub Pages frontend)

This package contains the updated static frontend for Social Studio.

## What's new in v0.5
- visible version tag in the header
- actual photo-return tools
- post/story/reel overlay text suggestions spelled out more clearly in the Photo tab
- Apply Basic Edits (local browser edit)
- Make 4:5 Post (local crop/export)
- Make 9:16 Story/Reel (local crop/export)
- AI Clean Up (calls new Firebase function `editSocialPhoto`)
- keeps the v0.3 quick tweaks and reel-mode options

## Files
Upload these files to the root of your `Social-content-studio` GitHub repository:
- `index.html`
- `styles.css`
- `app.js`
- `vercel.json`
- `.gitignore`
- `README.md`

## Important
For AI Clean Up to work, you must also deploy the matching Firebase v0.5 update so the `editSocialPhoto` function exists.
