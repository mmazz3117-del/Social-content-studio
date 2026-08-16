# Social Media Pal v1.9 — Tell Pal + Direction-Aware Editing

Frontend-only update. No Firebase redeploy is required.

## What v1.9 adds

- **🎙️ Tell Pal** beside the project description. Tap it and speak the creative brief instead of typing.
- Live speech-to-text when the browser provides the Web Speech recognition API.
- **Mic Settings** with Auto, Mono, and Stereo modes plus a microphone test and live input meter.
- Auto microphone mode tries compatible device/default, mono, and stereo microphone constraints when opening/testing the mic.
- Clear mic status messages for permission, no-speech, audio-capture, and unsupported-browser cases.
- The mic preference is remembered on the device.
- The user's project description now affects local Reel editing choices more directly, including pacing, clip length, still-photo duration, transition softness, motion style, and whether video is prioritized.
- Phrases such as **energetic / quick / punchy** produce faster pacing and shorter transitions.
- Phrases such as **smooth / elegant / calm / cinematic** produce longer shots and softer transitions.
- **store tour / whole store / overview** biases still-photo movement toward pans.
- **product / detail / close-up / spotlight** biases still-photo movement toward gentle zooms.
- **focus on video / footage / clips** guarantees moving footage is included when possible.
- **use the full video / don't cut it** preserves a single video as one continuous segment when the project contains only that video.

## Everything from v1.8 is included

v1.9 is cumulative. You do not need to deploy v1.8 first. It includes the v1.8 Worker Mode/UI polish, multiple-video support, multi-clip Reels, stronger Quick Tweaks, project cleanup, save/share workflow, Social Media Pal branding, and app icons.

## Important microphone note

Mic Settings apply to Social Media Pal's own Tell Pal microphone access/test path. Apple's keyboard Dictation microphone is controlled by iOS and cannot be forced to mono or stereo by the webpage.
