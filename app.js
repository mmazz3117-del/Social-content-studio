const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBHaqL2jdszBeX1BeZnL8OZwv0fTYda8Ds",
  authDomain: "stressed-logit.firebaseapp.com",
  projectId: "stressed-logit",
  storageBucket: "stressed-logit.firebasestorage.app",
  messagingSenderId: "760019750856",
  appId: "1:760019750856:web:a92c36ae1a2e49bb677afd"
};

const FIREBASE_REGION = 'us-central1';
const FUNCTION_NAME = 'generateSocialPackage';
const PHOTO_EDIT_FUNCTION = 'editSocialPhoto';
const MAX_IMAGES = 6;
const MAX_VIDEOS = 1;
const VIDEO_FRAME_COUNT = 3;
const MAX_TOTAL_IMAGE_CHARS = 12_000_000;
const PROJECTS_STORAGE_KEY = 'socialStudioRecentProjectsV10';
const MAX_RECENT_PROJECTS = 8;

const REFINE_INSTRUCTIONS = {
  shorter: 'Make the package tighter and more concise. Shorten the primary caption and story first while keeping the same facts and tone.',
  more_fun: 'Keep the same facts, but make the wording a little more playful and lively without sounding cheesy or overhyped.',
  less_salesy: 'Keep the same facts, but make the writing feel more natural, local, and less promotional or pushy.',
  try_another: 'Create a fresh alternate version of the whole package. Keep the same facts and general tone, but take a slightly different writing angle.'
};

const state = {
  photos: [],
  result: null,
  user: null,
  authReady: false,
  isLoading: false,
  selectedPhotoIndex: 0,
  editedPhotoDataUrl: '',
  editedPhotoLabel: '',
  recentProjects: [],
  videoSource: null,
};

const els = {
  photoInput: document.getElementById('photoInput'),
  dropZone: document.getElementById('dropZone'),
  photoGrid: document.getElementById('photoGrid'),
  description: document.getElementById('description'),
  contentType: document.getElementById('contentType'),
  tone: document.getElementById('tone'),
  includeReel: document.getElementById('includeReel'),
  includeStory: document.getElementById('includeStory'),
  includeVisual: document.getElementById('includeVisual'),
  includeHashtags: document.getElementById('includeHashtags'),
  reelModeWrap: document.getElementById('reelModeWrap'),
  reelMode: document.getElementById('reelMode'),
  generateBtn: document.getElementById('generateBtn'),
  generateLabel: document.getElementById('generateLabel'),
  oneTapBtn: document.getElementById('oneTapBtn'),
  apiStatus: document.getElementById('apiStatus'),
  authBtn: document.getElementById('authBtn'),
  userName: document.getElementById('userName'),
  authNotice: document.getElementById('authNotice'),
  emptyState: document.getElementById('emptyState'),
  resultsState: document.getElementById('resultsState'),
  profileBtn: document.getElementById('profileBtn'),
  profileDialog: document.getElementById('profileDialog'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),
  businessName: document.getElementById('businessName'),
  businessLocation: document.getElementById('businessLocation'),
  brandVoice: document.getElementById('brandVoice'),
  brandDefaults: document.getElementById('brandDefaults'),
  newBtn: document.getElementById('newBtn'),
  toast: document.getElementById('toast'),
  refineBtns: [...document.querySelectorAll('.refine-btn')],
  selectedPhoto: document.getElementById('selectedPhoto'),
  basicEditBtn: document.getElementById('basicEditBtn'),
  aiCleanupBtn: document.getElementById('aiCleanupBtn'),
  format45Btn: document.getElementById('format45Btn'),
  format916Btn: document.getElementById('format916Btn'),
  createPostGraphicBtn: document.getElementById('createPostGraphicBtn'),
  editedPreviewCard: document.getElementById('editedPreviewCard'),
  editedPreviewTitle: document.getElementById('editedPreviewTitle'),
  originalPreview: document.getElementById('originalPreview'),
  editedPreview: document.getElementById('editedPreview'),
  downloadEditedBtn: document.getElementById('downloadEditedBtn'),
  editSummary: document.getElementById('editSummary'),
  previewBasicBtn: document.getElementById('previewBasicBtn'),
  previewAiBtn: document.getElementById('previewAiBtn'),
  preview45Btn: document.getElementById('preview45Btn'),
  preview916Btn: document.getElementById('preview916Btn'),
  previewGraphicBtn: document.getElementById('previewGraphicBtn'),
  recentProjectsPanel: document.getElementById('recentProjectsPanel'),
  recentProjectsList: document.getElementById('recentProjectsList'),
  clearProjectsBtn: document.getElementById('clearProjectsBtn'),
  detailsToggleBtn: document.getElementById('detailsToggleBtn'),
};

const defaultProfile = {
  businessName: 'Ocean State Spice & Tea Merchants',
  businessLocation: 'Wayland Square, Providence, Rhode Island',
  brandVoice: 'Warm, polished, knowledgeable, local, inviting, and never overly salesy. Keep the writing natural rather than generic or overhyped.',
  brandDefaults: 'Use Ocean State Spice & Tea Merchants by name when useful. Preferred local tags include #OceanStateSpiceAndTea #WaylandSquare #ProvidenceRI #ShopLocalRI. Avoid cluttering posts with too many hashtags.',
};

let auth;
let functions;
let googleProvider;
let generateSocialPackage;
let editSocialPhoto;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function showAuthNotice(message) {
  els.authNotice.textContent = message;
  els.authNotice.classList.remove('hidden');
  clearTimeout(showAuthNotice.timer);
  showAuthNotice.timer = setTimeout(() => els.authNotice.classList.add('hidden'), 6500);
}

function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
  } catch {
    return '';
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (c) => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[c]));
}

function loadProfile() {
  let profile = defaultProfile;
  try {
    profile = {...defaultProfile, ...JSON.parse(localStorage.getItem('socialStudioProfile') || '{}')};
  } catch {}

  els.businessName.value = profile.businessName;
  els.businessLocation.value = profile.businessLocation;
  els.brandVoice.value = profile.brandVoice;
  els.brandDefaults.value = profile.brandDefaults;
  return profile;
}

function getProfile() {
  return {
    businessName: els.businessName.value.trim(),
    businessLocation: els.businessLocation.value.trim(),
    brandVoice: els.brandVoice.value.trim(),
    brandDefaults: els.brandDefaults.value.trim(),
  };
}

function initFirebase() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    functions = firebase.app().functions(FIREBASE_REGION);
    googleProvider = new firebase.auth.GoogleAuthProvider();
    generateSocialPackage = functions.httpsCallable(FUNCTION_NAME);
    editSocialPhoto = functions.httpsCallable(PHOTO_EDIT_FUNCTION);

    auth.onAuthStateChanged((user) => {
      state.user = user || null;
      state.authReady = true;
      renderAuthState();
    });
  } catch (error) {
    console.error('Firebase initialization failed', error);
    els.apiStatus.textContent = 'Firebase unavailable';
    els.apiStatus.className = 'status-pill demo';
    showAuthNotice('Firebase could not initialize. Check the browser console for details.');
  }
}

function renderAuthState() {
  if (!state.user) {
    els.apiStatus.textContent = 'Sign in to connect';
    els.apiStatus.className = 'status-pill demo';
    els.authBtn.textContent = 'Sign in with Google';
    els.userName.classList.add('hidden');
    els.userName.textContent = '';
    return;
  }

  els.apiStatus.textContent = 'Firebase AI ready';
  els.apiStatus.className = 'status-pill live';
  els.authBtn.textContent = 'Sign out';
  els.userName.textContent = state.user.displayName || state.user.email || 'Signed in';
  els.userName.classList.remove('hidden');
}

async function signIn() {
  try {
    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    if (error?.code === 'auth/popup-blocked') {
      await auth.signInWithRedirect(googleProvider);
      return;
    }
    console.error(error);
    if (error?.code === 'auth/unauthorized-domain') {
      showAuthNotice('This site domain must be added in Firebase Authentication → Settings → Authorized domains.');
      return;
    }
    showAuthNotice(error?.message || 'Google sign-in could not be completed.');
  }
}

function updateReelModeVisibility() {
  els.reelModeWrap.classList.toggle('hidden', !els.includeReel.checked);
}

function setOneTapDefaults() {
  els.contentType.value = 'Full social package';
  els.includeReel.checked = true;
  els.includeStory.checked = true;
  els.includeVisual.checked = true;
  els.includeHashtags.checked = true;
  updateReelModeVisibility();
}

els.authBtn.addEventListener('click', async () => {
  if (!auth) return;
  if (state.user) {
    await auth.signOut();
    showToast('Signed out');
  } else {
    await signIn();
  }
});

els.profileBtn.addEventListener('click', () => els.profileDialog.showModal());
els.saveProfileBtn.addEventListener('click', () => {
  localStorage.setItem('socialStudioProfile', JSON.stringify(getProfile()));
  els.profileDialog.close();
  showToast('Business profile saved');
});

els.photoInput.addEventListener('change', (event) => addFiles([...event.target.files]));
['dragenter', 'dragover'].forEach((type) => {
  els.dropZone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropZone.classList.add('dragging');
  });
});
['dragleave', 'drop'].forEach((type) => {
  els.dropZone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('dragging');
  });
});
els.dropZone.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));
els.includeReel.addEventListener('change', updateReelModeVisibility);

async function addFiles(files) {
  const images = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
  const videos = files.filter((f) => String(f.type || '').startsWith('video/'));

  if (videos.length > MAX_VIDEOS || (videos.length && state.videoSource)) {
    showToast('Social Studio currently supports one video per project');
  }

  const slots = () => Math.max(0, MAX_IMAGES - state.photos.length);

  for (const file of images) {
    if (!slots()) break;
    try {
      const optimized = await optimizeImage(file);
      state.photos.push({name: file.name, dataUrl: optimized, sourceType: 'photo'});
    } catch {
      showToast(`Could not read ${file.name}`);
    }
  }

  if (videos.length && !state.videoSource && slots()) {
    const file = videos[0];
    try {
      showToast('Analyzing video frames…');
      const extracted = await extractVideoFrames(file, Math.min(VIDEO_FRAME_COUNT, slots()));
      extracted.frames.forEach((frame, index) => {
        state.photos.push({
          name: `${file.name} — frame ${index + 1}`,
          dataUrl: frame.dataUrl,
          sourceType: 'videoFrame',
          videoName: file.name,
          videoTime: frame.time,
        });
      });
      state.videoSource = {
        name: file.name,
        duration: extracted.duration,
        frameCount: extracted.frames.length,
      };
      showToast(`Video ready — ${extracted.frames.length} key frames sampled`);
    } catch (error) {
      console.error(error);
      showAuthNotice('That video could not be sampled. Try an MP4, MOV, or WebM clip.');
    }
  }

  if (!images.length && !videos.length) {
    showToast('Choose a JPG, PNG, WebP, MP4, MOV, or WebM file');
  } else if (!slots() && (images.length + videos.length) > 0) {
    showToast(`Maximum of ${MAX_IMAGES} photos/video frames`);
  }

  renderPhotos();
  refreshSelectedPhotoOptions();
  els.photoInput.value = '';
}

function waitForMediaEvent(target, eventName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 12000);
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(target.error || new Error(`Media error before ${eventName}`));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      target.removeEventListener(eventName, onEvent);
      target.removeEventListener('error', onError);
    };
    target.addEventListener(eventName, onEvent, {once: true});
    target.addEventListener('error', onError, {once: true});
  });
}

async function extractVideoFrames(file, frameCount = VIDEO_FRAME_COUNT) {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    if (video.readyState < 1) await waitForMediaEvent(video, 'loadedmetadata');
    if (video.readyState < 2) await waitForMediaEvent(video, 'loadeddata');

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const safeCount = Math.max(1, Math.min(VIDEO_FRAME_COUNT, Number(frameCount) || 1));
    const positions = safeCount === 1
      ? [0.5]
      : Array.from({length: safeCount}, (_, index) => 0.12 + ((0.76 * index) / (safeCount - 1)));
    const frames = [];

    for (const ratio of positions) {
      const target = Math.min(Math.max(0, duration * ratio), Math.max(0, duration - 0.05));
      if (Math.abs(video.currentTime - target) > 0.02) {
        video.currentTime = target;
        await waitForMediaEvent(video, 'seeked');
      }

      const maxSide = 1400;
      const sourceWidth = video.videoWidth || 1280;
      const sourceHeight = video.videoHeight || 720;
      const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({time: target, dataUrl: canvas.toDataURL('image/jpeg', .82)});
    }

    return {duration, frames};
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function optimizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxSide = 1400;
        let {width, height} = img;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', .82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  els.photoGrid.innerHTML = state.photos.map((photo, i) => {
    const isVideo = photo.sourceType === 'videoFrame';
    const badge = isVideo ? `VIDEO F${state.photos.slice(0, i + 1).filter((p) => p.sourceType === 'videoFrame').length}` : `PHOTO ${i + 1}`;
    const time = isVideo && Number.isFinite(photo.videoTime) ? `<span class="video-time">${photo.videoTime.toFixed(1)}s</span>` : '';
    return `
    <div class="photo-item">
      <img src="${photo.dataUrl}" alt="${isVideo ? 'Video frame' : 'Photo'} ${i + 1}" />
      <span class="photo-badge">${badge}</span>
      ${time}
      <button class="photo-remove" type="button" data-index="${i}" aria-label="Remove media ${i + 1}">×</button>
    </div>`;
  }).join('');

  els.photoGrid.querySelectorAll('.photo-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.photos.splice(Number(btn.dataset.index), 1);
      if (!state.photos.some((p) => p.sourceType === 'videoFrame')) state.videoSource = null;
      state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
      clearEditedPreview();
      renderPhotos();
      refreshSelectedPhotoOptions();
    });
  });
}

function setPackageLoading(isLoading, label = '✨ Create Social Package') {
  state.isLoading = isLoading;
  els.generateBtn.disabled = isLoading;
  els.oneTapBtn.disabled = isLoading;
  els.refineBtns.forEach((btn) => { btn.disabled = isLoading; });
  els.generateLabel.textContent = isLoading ? label : '✨ Create Social Package';
}

function setActivePhotoButton(button, isLoading, loadingText = 'Working…') {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function buildPayload(action = 'generate', refineInstruction = '', extras = {}) {
  const videoFrames = state.photos.filter((p) => p.sourceType === 'videoFrame');
  return {
    action,
    oneTap: Boolean(extras.oneTap),
    description: els.description.value.trim(),
    contentType: els.contentType.value,
    tone: els.tone.value,
    options: {
      reel: els.includeReel.checked,
      story: els.includeStory.checked,
      visual: els.includeVisual.checked,
      hashtags: els.includeHashtags.checked,
      reelMode: els.reelMode.value,
    },
    profile: getProfile(),
    images: state.photos.map((p) => p.dataUrl),
    mediaManifest: state.photos.map((p, index) => ({
      imageNumber: index + 1,
      sourceType: p.sourceType === 'videoFrame' ? 'videoFrame' : 'photo',
      name: p.name || '',
      videoTime: Number.isFinite(p.videoTime) ? Number(p.videoTime.toFixed(2)) : null,
    })),
    videoContext: state.videoSource ? {
      ...state.videoSource,
      frameCount: videoFrames.length,
      frameTimes: videoFrames.map((p) => Number(p.videoTime || 0).toFixed(1)),
    } : null,
    currentResult: action === 'refine' ? state.result : undefined,
    refineInstruction: action === 'refine' ? refineInstruction : undefined,
  };
}

async function runPackageRequest(action = 'generate', refineInstruction = '', extras = {}) {
  const description = els.description.value.trim();
  const totalChars = state.photos.reduce((sum, p) => sum + p.dataUrl.length, 0);

  if (action === 'generate' && !description && !state.photos.length) {
    showToast('Add a photo or tell me what the post is about');
    els.description.focus();
    return;
  }

  if (action === 'refine' && !state.result) {
    showToast('Create a package first');
    return;
  }

  if (!state.authReady) {
    showToast('Connecting to Firebase…');
    return;
  }

  if (!state.user) {
    showAuthNotice('Sign in with Google first, then press Create Social Package.');
    await signIn();
    return;
  }

  if (totalChars > MAX_TOTAL_IMAGE_CHARS) {
    showToast('Those photos are still too large together. Remove one or two and try again.');
    return;
  }

  const loadingLabel = extras.oneTap ? 'One-Tap Create is building your package…' :
    action === 'generate' ? 'Creating your social package…' : 'Refining your package…';

  setPackageLoading(true, loadingLabel);
  try {
    const response = await generateSocialPackage(buildPayload(action, refineInstruction, extras));
    const data = response?.data || {};
    if (!data.result) throw new Error('No social package was returned.');
    state.result = data.result;
    clearEditedPreview();
    renderResult(data.result);
    await saveCurrentProject();
    els.apiStatus.textContent = 'Firebase AI ready';
    els.apiStatus.className = 'status-pill live';
  } catch (error) {
    console.error(error);
    const code = String(error?.code || '');
    if (code.includes('unauthenticated')) {
      showAuthNotice('Your sign-in expired. Sign in again and retry.');
    } else if (code.includes('resource-exhausted')) {
      showAuthNotice('The social-content limit was reached. Try again a little later.');
    } else if (code.includes('invalid-argument')) {
      showAuthNotice(error?.message || 'Please check the information and photos and try again.');
    } else {
      showAuthNotice(error?.message || 'The AI request could not be completed.');
    }
  } finally {
    setPackageLoading(false);
  }
}

els.generateBtn.addEventListener('click', () => runPackageRequest('generate'));
els.oneTapBtn.addEventListener('click', () => {
  setOneTapDefaults();
  if (!els.description.value.trim() && state.photos.length) {
    showToast('One-Tap Create will choose the strongest angle from your photos.');
  }
  runPackageRequest('generate', '', {oneTap: true});
});

els.refineBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.refine;
    const instruction = REFINE_INSTRUCTIONS[key];
    if (!instruction) return;
    runPackageRequest('refine', instruction);
  });
});

function safeText(value, fallback = 'Not generated for this package.') {
  return (value === undefined || value === null || value === '') ? fallback : String(value);
}

function renderResult(result) {
  els.emptyState.classList.add('hidden');
  els.resultsState.classList.remove('hidden');
  document.getElementById('resultHeadline').textContent = result.headline || 'Ready to post';
  document.getElementById('captionOutput').textContent = safeText(result.caption);
  document.getElementById('alternateOutput').textContent = safeText(result.alternate);
  document.getElementById('hashtagsOutput').textContent = Array.isArray(result.hashtags) ? result.hashtags.join(' ') : safeText(result.hashtags);
  document.getElementById('postOverlayOutput').textContent = safeText(result.postOverlayText);
  document.getElementById('reelHookOutput').textContent = safeText(result.reelHook);
  document.getElementById('overlayOutput').textContent = safeText(result.overlayText);
  document.getElementById('storyOutput').textContent = safeText(result.story);
  document.getElementById('storyOverlayOutput').textContent = safeText(result.storyOverlayText);
  document.getElementById('ctaOutput').textContent = safeText(result.cta);
  document.getElementById('leadImageOutput').textContent = safeText(result.leadImage);
  renderSequence('reelPlanOutput', result.reelPlan, 'SHOT');
  renderSequence('visualNotesOutput', result.visualNotes, 'PHOTO');
  refreshSelectedPhotoOptions();
  activateTab('caption');
  if (window.innerWidth < 981) {
    els.resultsState.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}

function renderSequence(id, items, label) {
  const el = document.getElementById(id);
  if (!Array.isArray(items) || !items.length) {
    el.innerHTML = '<div class="formatted-output">Not generated for this package.</div>';
    return;
  }
  const openByDefault = window.innerWidth > 700;
  el.innerHTML = items.map((item, i) => {
    const title = typeof item === 'string' ? `${label} ${i + 1}` : (item.title || `${label} ${i + 1}`);
    const detail = typeof item === 'string' ? item : (item.detail || item.note || '');
    const overlay = typeof item === 'object' ? (item.overlayText || '') : '';
    const overlayHtml = overlay ? `<div class="overlay-chip"><span>Overlay:</span> ${escapeHtml(overlay)}</div>` : '';
    return `<details class="sequence-item" ${openByDefault ? 'open' : ''}>
      <summary><span class="sequence-index">${i + 1}</span><strong>${escapeHtml(title)}</strong><span class="sequence-chevron">⌄</span></summary>
      <div class="sequence-detail"><p>${escapeHtml(detail)}</p>${overlayHtml}</div>
    </details>`;
  }).join('');
  updateDetailsToggleLabel();
}

function visibleSequenceDetails() {
  return [...document.querySelectorAll('.result-panel:not(.hidden) details.sequence-item')];
}

function updateDetailsToggleLabel() {
  if (!els.detailsToggleBtn) return;
  const details = visibleSequenceDetails();
  if (!details.length) {
    els.detailsToggleBtn.classList.add('hidden');
    return;
  }
  els.detailsToggleBtn.classList.remove('hidden');
  const allOpen = details.every((item) => item.open);
  els.detailsToggleBtn.textContent = allOpen ? 'Collapse details' : 'Expand details';
}

els.detailsToggleBtn?.addEventListener('click', () => {
  const details = visibleSequenceDetails();
  const shouldOpen = !details.every((item) => item.open);
  details.forEach((item) => { item.open = shouldOpen; });
  updateDetailsToggleLabel();
});

document.addEventListener('toggle', (event) => {
  if (event.target?.matches?.('details.sequence-item')) updateDetailsToggleLabel();
}, true);

function activateTab(name) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === name);
  });
  document.querySelectorAll('.result-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.panel !== name);
  });
  updateDetailsToggleLabel();
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

const copyMap = {
  caption: 'caption',
  alternate: 'alternate',
  hashtags: 'hashtags',
  postOverlayText: 'postOverlayText',
  reelHook: 'reelHook',
  overlayText: 'overlayText',
  story: 'story',
  storyOverlayText: 'storyOverlayText',
  cta: 'cta'
};

document.querySelectorAll('.copy-btn').forEach((btn) => {
  if (btn.id === 'downloadEditedBtn') return;
  btn.addEventListener('click', async () => {
    if (!state.result) return;
    let value = state.result[copyMap[btn.dataset.copy]];
    if (Array.isArray(value)) value = value.join(' ');
    await navigator.clipboard.writeText(value || '');
    showToast('Copied');
  });
});

els.newBtn.addEventListener('click', () => {
  state.result = null;
  clearEditedPreview();
  els.resultsState.classList.add('hidden');
  els.emptyState.classList.remove('hidden');
  els.description.focus();
  window.scrollTo({top: 0, behavior: 'smooth'});
});

function refreshSelectedPhotoOptions() {
  let videoFrameNumber = 0;
  let photoNumber = 0;
  els.selectedPhoto.innerHTML = state.photos.map((photo, index) => {
    const isVideoFrame = photo.sourceType === 'videoFrame';
    if (isVideoFrame) videoFrameNumber += 1;
    else photoNumber += 1;
    const label = isVideoFrame
      ? `Video frame ${videoFrameNumber}${Number.isFinite(photo.videoTime) ? ` (${photo.videoTime.toFixed(1)}s)` : ''}`
      : `Photo ${photoNumber}`;
    return `<option value="${index}">${label}${photo.name ? ` — ${escapeHtml(photo.name)}` : ''}</option>`;
  }).join('');
  els.selectedPhoto.disabled = !state.photos.length;
  if (state.photos.length) {
    state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, state.photos.length - 1);
    els.selectedPhoto.value = String(state.selectedPhotoIndex);
  }
}

els.selectedPhoto.addEventListener('change', () => {
  state.selectedPhotoIndex = Number(els.selectedPhoto.value || 0);
  clearEditedPreview();
});

function getSelectedPhoto() {
  return state.photos[state.selectedPhotoIndex] || null;
}

function leadPhotoIndex() {
  const lead = state.result?.leadImage || '';

  const imageMatch = lead.match(/image\s*(\d+)/i);
  if (imageMatch) {
    const index = Math.max(0, Number(imageMatch[1]) - 1);
    if (state.photos[index]) return index;
  }

  const frameMatch = lead.match(/(?:video\s*)?frame\s*(\d+)/i);
  if (frameMatch) {
    const frameNumber = Math.max(1, Number(frameMatch[1]));
    const frameIndexes = state.photos
      .map((photo, index) => photo.sourceType === 'videoFrame' ? index : -1)
      .filter((index) => index >= 0);
    if (frameIndexes[frameNumber - 1] !== undefined) return frameIndexes[frameNumber - 1];
  }

  const photoMatch = lead.match(/photo\s*(\d+)/i);
  if (photoMatch) {
    const photoNumber = Math.max(1, Number(photoMatch[1]));
    const photoIndexes = state.photos
      .map((photo, index) => photo.sourceType !== 'videoFrame' ? index : -1)
      .filter((index) => index >= 0);
    if (photoIndexes[photoNumber - 1] !== undefined) return photoIndexes[photoNumber - 1];
  }

  return Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
}

function clearEditedPreview() {
  state.editedPhotoDataUrl = '';
  state.editedPhotoLabel = '';
  els.editedPreviewCard.classList.add('hidden');
  els.originalPreview.removeAttribute('src');
  els.editedPreview.removeAttribute('src');
  els.downloadEditedBtn.disabled = true;
  els.editSummary.textContent = '';
}

function showEditedPreview(editedDataUrl, label, summary = '', originalDataUrl = '') {
  const photo = getSelectedPhoto();
  const sourceImage = originalDataUrl || photo?.dataUrl || editedDataUrl;
  state.editedPhotoDataUrl = editedDataUrl;
  state.editedPhotoLabel = label;
  els.editedPreviewTitle.textContent = label;
  els.originalPreview.src = sourceImage;
  els.editedPreview.src = editedDataUrl;
  els.editSummary.textContent = summary;
  els.editedPreviewCard.classList.remove('hidden');
  els.downloadEditedBtn.disabled = false;
  activateTab('visual');
  if (window.innerWidth < 981) {
    els.editedPreviewCard.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}

function selectedPhotoNoteText() {
  const notes = state.result?.visualNotes;
  if (!Array.isArray(notes) || !notes[state.selectedPhotoIndex]) return '';
  return notes[state.selectedPhotoIndex]?.detail || '';
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function createLocalEditedPhoto(dataUrl, options = {}) {
  const img = await loadImageFromDataUrl(dataUrl);
  const mode = options.mode || 'basic';
  const targetAspect = options.targetAspect || null;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (targetAspect) {
    const sourceAspect = img.width / img.height;
    if (sourceAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = Math.max(0, (img.height - sh) * 0.38);
    }
  } else {
    const crop = Math.max(0, Math.min(0.14, Number(options.crop ?? (mode === 'basic' ? 0.07 : 0.04))));
    sx = img.width * crop;
    sy = img.height * crop;
    sw = img.width * (1 - crop * 2);
    sh = img.height * (1 - crop * 2);
  }

  const outputWidth = targetAspect ? 1200 : Math.max(1, Math.round(sw));
  const outputHeight = targetAspect ? Math.round(outputWidth / targetAspect) : Math.max(1, Math.round(sh));
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  const brightness = Number(options.brightness ?? (mode === 'basic' ? 1.10 : 1.06));
  const contrast = Number(options.contrast ?? (mode === 'basic' ? 1.10 : 1.08));
  const saturation = Number(options.saturation ?? (mode === 'basic' ? 1.07 : 1.04));
  const warmth = Number(options.warmth ?? (mode === 'basic' ? 0.025 : 0.018));
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) sepia(${warmth})`;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL('image/jpeg', 0.94);
}

function safeAiEditOptions(noteText = '') {
  const note = String(noteText).toLowerCase();
  return {
    mode: 'safeAi',
    crop: /crop|tighter|framing|composition/.test(note) ? 0.055 : 0.025,
    brightness: /exposure|bright|dark|shadow|lighting/.test(note) ? 1.08 : 1.045,
    contrast: /contrast|clarity|sharp|pop|readability/.test(note) ? 1.10 : 1.06,
    saturation: /color|warm|vibran|tone/.test(note) ? 1.055 : 1.025,
    warmth: /warm|yellow|gold|cozy/.test(note) ? 0.025 : 0.012,
  };
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

async function createPostGraphic(dataUrl) {
  const img = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  const targetAspect = canvas.width / canvas.height;
  const sourceAspect = img.width / img.height;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (sourceAspect > targetAspect) {
    sw = img.height * targetAspect;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetAspect;
    sy = Math.max(0, (img.height - sh) * 0.35);
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const overlayGradient = ctx.createLinearGradient(0, canvas.height * 0.40, 0, canvas.height);
  overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
  overlayGradient.addColorStop(0.55, 'rgba(0,0,0,0.24)');
  overlayGradient.addColorStop(1, 'rgba(0,0,0,0.76)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brand = getProfile().businessName || 'Ocean State Spice & Tea Merchants';
  const location = getProfile().businessLocation || '';
  const text = state.result?.postOverlayText || state.result?.headline || 'New in the shop';
  const subText = location ? `${brand} • ${location}` : brand;

  const left = 70;
  const maxWidth = canvas.width - left * 2;

  let subFontSize = 27;
  let footerLines = [];
  do {
    ctx.font = `600 ${subFontSize}px Inter, Arial, sans-serif`;
    footerLines = wrapText(ctx, subText, maxWidth);
    if (footerLines.length <= 2 && footerLines.every((line) => ctx.measureText(line).width <= maxWidth)) break;
    subFontSize -= 2;
  } while (subFontSize > 18);
  footerLines = footerLines.slice(0, 2);
  const footerLineHeight = Math.round(subFontSize * 1.22);
  const footerBottom = 58;
  const footerHeight = footerLines.length * footerLineHeight;

  let fontSize = 82;
  let lines = [];
  do {
    ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= 4 && lines.every((line) => ctx.measureText(line).width <= maxWidth)) break;
    fontSize -= 4;
  } while (fontSize > 44);

  const lineHeight = Math.round(fontSize * 1.05);
  const textBlockHeight = lines.length * lineHeight;
  const gapToFooter = 34;
  const textBottom = canvas.height - footerBottom - footerHeight - gapToFooter;
  const y = Math.max(canvas.height * 0.54, textBottom - textBlockHeight);

  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, left, y + (index * lineHeight));
  });

  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.font = `600 ${subFontSize}px Inter, Arial, sans-serif`;
  const footerY = canvas.height - footerBottom - footerHeight;
  footerLines.forEach((line, index) => {
    ctx.fillText(line, left, footerY + (index * footerLineHeight));
  });

  return canvas.toDataURL('image/jpeg', 0.95);
}

async function runLocalPhotoTool(tool, sourceButton = null) {
  const photo = getSelectedPhoto();
  if (!photo) {
    showToast('Choose a photo first');
    return;
  }

  let label = 'Adjusted photo';
  let summary = '';
  let options = {mode: 'basic'};
  let originalDataUrl = photo.dataUrl;

  if (tool === 'basic') {
    label = 'Auto enhanced photo';
    summary = 'Applied a tighter center crop, brighter exposure, stronger contrast, and a small color boost. This is a non-generative edit, so products and labels stay exactly from your original image.';
    options = {mode: 'basic'};
  } else if (tool === '4x5') {
    label = '4:5 post version';
    summary = 'Reframed the original photo to a 4:5 portrait crop for an Instagram/Facebook feed post, with a small light and color lift.';
    options = {mode: 'format', targetAspect: 4 / 5};
  } else if (tool === '9x16') {
    label = '9:16 story/reel version';
    summary = 'Reframed the original photo to a 9:16 vertical crop for Stories/Reels, with a small light and color lift.';
    options = {mode: 'format', targetAspect: 9 / 16};
  } else if (tool === 'postGraphic') {
    if (!state.result) {
      showToast('Create a package first so the app has overlay text to use');
      return;
    }
    label = '4:5 post graphic';
    summary = 'Built a ready-to-post 4:5 graphic using your chosen image and the suggested post overlay text. Download it and use it as a finished post image or starting point.';
    originalDataUrl = state.photos[leadPhotoIndex()]?.dataUrl || photo.dataUrl;
  }

  setActivePhotoButton(sourceButton, true, tool === 'postGraphic' ? 'Building…' : 'Working…');
  try {
    const edited = tool === 'postGraphic'
      ? await createPostGraphic(originalDataUrl)
      : await createLocalEditedPhoto(photo.dataUrl, options);
    showEditedPreview(edited, label, summary, originalDataUrl);
  } catch (error) {
    console.error(error);
    showAuthNotice('That photo could not be processed in the browser.');
  } finally {
    setActivePhotoButton(sourceButton, false);
  }
}

async function runAiCleanup(sourceButton = null) {
  const photo = getSelectedPhoto();
  if (!photo) {
    showToast('Choose a photo first');
    return;
  }
  if (!state.result) {
    showToast('Create a package first so the AI has photo feedback to follow');
    return;
  }

  setActivePhotoButton(sourceButton, true, 'Applying safe edit…');
  try {
    const note = selectedPhotoNoteText();
    const edited = await createLocalEditedPhoto(photo.dataUrl, safeAiEditOptions(note));
    showEditedPreview(
      edited,
      'AI recommended edit — Preserve Reality',
      'Used the AI photo-analysis notes to choose a safe crop and light/color polish. This edit is non-generative: it does not redraw, replace, invent, or relabel products, packaging, logos, or shelf contents.'
    );
  } catch (error) {
    console.error(error);
    showAuthNotice('That photo could not be safely adjusted in the browser.');
  } finally {
    setActivePhotoButton(sourceButton, false);
  }
}

els.basicEditBtn.addEventListener('click', () => runLocalPhotoTool('basic', els.basicEditBtn));
els.format45Btn.addEventListener('click', () => runLocalPhotoTool('4x5', els.format45Btn));
els.format916Btn.addEventListener('click', () => runLocalPhotoTool('9x16', els.format916Btn));
els.aiCleanupBtn.addEventListener('click', () => runAiCleanup(els.aiCleanupBtn));
els.createPostGraphicBtn.addEventListener('click', () => runLocalPhotoTool('postGraphic', els.createPostGraphicBtn));
els.previewBasicBtn.addEventListener('click', () => runLocalPhotoTool('basic', els.previewBasicBtn));
els.preview45Btn.addEventListener('click', () => runLocalPhotoTool('4x5', els.preview45Btn));
els.preview916Btn.addEventListener('click', () => runLocalPhotoTool('9x16', els.preview916Btn));
els.previewAiBtn.addEventListener('click', () => runAiCleanup(els.previewAiBtn));
els.previewGraphicBtn.addEventListener('click', () => runLocalPhotoTool('postGraphic', els.previewGraphicBtn));

els.downloadEditedBtn.addEventListener('click', () => {
  if (!state.editedPhotoDataUrl) return;
  const a = document.createElement('a');
  const safeLabel = (state.editedPhotoLabel || 'edited-photo').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.href = state.editedPhotoDataUrl;
  a.download = `${safeLabel || 'edited-photo'}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
});

async function compressDataUrlForHistory(dataUrl) {
  try {
    const img = await loadImageFromDataUrl(dataUrl);
    const maxSide = 520;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.62);
  } catch {
    return '';
  }
}

async function currentProjectSnapshot() {
  const historyPhotos = await Promise.all(state.photos.map(async (photo) => ({
    ...photo,
    dataUrl: await compressDataUrlForHistory(photo.dataUrl),
  })));

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    headline: state.result?.headline || els.description.value.trim() || 'Untitled project',
    description: els.description.value,
    contentType: els.contentType.value,
    tone: els.tone.value,
    options: {
      reel: els.includeReel.checked,
      story: els.includeStory.checked,
      visual: els.includeVisual.checked,
      hashtags: els.includeHashtags.checked,
      reelMode: els.reelMode.value,
    },
    photos: historyPhotos.filter((photo) => photo.dataUrl),
    videoSource: state.videoSource,
    result: state.result,
    historyMediaCompressed: true,
  };
}

async function saveCurrentProject() {
  if (!state.result) return;
  const snapshot = await currentProjectSnapshot();
  const deduped = state.recentProjects.filter((item) =>
    !(item.headline === snapshot.headline && item.description === snapshot.description));
  state.recentProjects = [snapshot, ...deduped].slice(0, MAX_RECENT_PROJECTS);

  const save = (projects) => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    state.recentProjects = projects;
  };

  try {
    save(state.recentProjects);
  } catch (error) {
    console.warn('Recent project storage is full; trimming older projects.', error);
    let trimmed = [...state.recentProjects];
    let saved = false;
    while (trimmed.length > 1 && !saved) {
      trimmed = trimmed.slice(0, -1);
      try {
        save(trimmed);
        saved = true;
      } catch {}
    }
    if (!saved) {
      const lightweight = [{...snapshot, photos: [], videoSource: null}];
      try {
        save(lightweight);
        showToast('Project saved without media preview to save phone storage');
      } catch {
        state.recentProjects = [];
      }
    } else {
      showToast('Older project history was trimmed to save phone storage');
    }
  }
  renderRecentProjects();
}

function loadRecentProjects() {
  try {
    const currentRaw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const legacyRaw = localStorage.getItem('socialStudioRecentProjectsV09') || localStorage.getItem('socialStudioRecentProjectsV08');
    state.recentProjects = JSON.parse(currentRaw || legacyRaw || '[]');
    if (!Array.isArray(state.recentProjects)) state.recentProjects = [];
    if (!currentRaw && legacyRaw && state.recentProjects.length) {
      try { localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(state.recentProjects)); } catch {}
    }
  } catch {
    state.recentProjects = [];
  }
  renderRecentProjects();
}

function renderRecentProjects() {
  const list = state.recentProjects || [];
  els.recentProjectsPanel.classList.toggle('hidden', !list.length);
  if (!list.length) {
    els.recentProjectsList.innerHTML = '';
    return;
  }
  els.recentProjectsList.innerHTML = list.map((project) => {
    const projectPhotos = Array.isArray(project.photos) ? project.photos : [];
    const photoCount = projectPhotos.filter((photo) => photo.sourceType !== 'videoFrame').length;
    const frameCount = projectPhotos.filter((photo) => photo.sourceType === 'videoFrame').length;
    const mediaBits = [];
    if (photoCount) mediaBits.push(`${photoCount} photo${photoCount === 1 ? '' : 's'}`);
    if (project.videoSource) mediaBits.push(`video${frameCount ? ` • ${frameCount} sampled frame${frameCount === 1 ? '' : 's'}` : ''}`);
    if (!mediaBits.length) mediaBits.push('saved content');
    return `
    <button class="recent-project" type="button" data-project-id="${project.id}">
      <div class="recent-project-title">${escapeHtml(project.headline || 'Untitled project')}</div>
      <div class="recent-project-meta">${escapeHtml(formatDateTime(project.createdAt))} • ${mediaBits.join(' • ')}</div>
    </button>`;
  }).join('');

  els.recentProjectsList.querySelectorAll('[data-project-id]').forEach((btn) => {
    btn.addEventListener('click', () => loadProject(btn.dataset.projectId));
  });
}

function applyProject(project) {
  if (!project) return;
  state.photos = Array.isArray(project.photos) ? project.photos : [];
  state.videoSource = project.videoSource || null;
  state.result = project.result || null;
  els.description.value = project.description || '';
  els.contentType.value = project.contentType || 'Full social package';
  els.tone.value = project.tone || 'warm, polished, local, and inviting';
  els.includeReel.checked = Boolean(project.options?.reel);
  els.includeStory.checked = Boolean(project.options?.story);
  els.includeVisual.checked = Boolean(project.options?.visual);
  els.includeHashtags.checked = Boolean(project.options?.hashtags);
  els.reelMode.value = project.options?.reelMode || 'uploaded_only';
  updateReelModeVisibility();
  renderPhotos();
  refreshSelectedPhotoOptions();
  clearEditedPreview();
  if (state.result) {
    renderResult(state.result);
  } else {
    els.resultsState.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
  }
  window.scrollTo({top: 0, behavior: 'smooth'});
  showToast('Project loaded');
}

function loadProject(projectId) {
  const project = state.recentProjects.find((item) => item.id === projectId);
  applyProject(project);
}

els.clearProjectsBtn.addEventListener('click', () => {
  state.recentProjects = [];
  localStorage.removeItem(PROJECTS_STORAGE_KEY);
  localStorage.removeItem('socialStudioRecentProjectsV09');
  localStorage.removeItem('socialStudioRecentProjectsV08');
  renderRecentProjects();
  showToast('Recent projects cleared');
});

loadProfile();
loadRecentProjects();
updateReelModeVisibility();
refreshSelectedPhotoOptions();
initFirebase();
