# Social Media Pal v1.9.4 — Motion-to-Motion Reel Transitions

Frontend-only GitHub Pages build. No Firebase function deployment is required for this release.

This build fixes the pause/jump behavior between Reel video clips. The preview now uses two video layers so the incoming clip can be prepared while the outgoing clip keeps moving. The exported Reel preloads selected video start points before recording begins and overlaps outgoing/incoming moving media during transitions instead of holding a frozen last frame.

Upload the contents of this folder to the root of the GitHub Pages repository, replacing files with matching names.
