# Social Media Pal v1.5 — Real Video Worker Reels + Project Delete

Frontend-only update. No Firebase redeploy is required.

## What changed

- Original uploaded video is now retained locally in the browser (IndexedDB when available) in addition to the sampled F1/F2/F3 analysis frames.
- The AI still analyzes sampled still frames, but Worker Mode now uses the original moving footage around the AI-selected timestamps when assembling/exporting a Reel.
- Short video-only projects use the real moving clip once instead of turning the three analysis frames into three animated stills.
- Mixed photo/video Reels can combine actual moving video segments with still-photo motion (zoom in/out, pans, steady holds).
- The first small fraction of a longer clip is trimmed where possible to reduce the common hand-shake at the instant recording begins.
- Video thumbnails are explicitly labeled/explained as analysis snapshots only.
- Saved projects can restore their original video from local browser storage when available.
- Each Recent Project now has its own trash button with confirmation. “Clear all” remains available.
- Feed/Story/Reel Save / Share behavior from v1.3 stays intact.
- Reel text suggestions remain reference-only and are not burned into the exported video.

## Current limitation

The auto-rendered Reel is designed as clean visual media for social posting. Original source-video audio is not mixed into the rendered Reel in this version; add music/audio when posting or keep the original clip separately if its sound is important.
