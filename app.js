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
const PROJECTS_STORAGE_KEY = 'socialStudioRecentProjectsV15';
const MAX_RECENT_PROJECTS = 8;
const MEDIA_DB_NAME = 'socialStudioMediaV1';
const MEDIA_DB_STORE = 'videos';

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
  originalPreviewDataUrl: '',
  previewMode: 'edited',
  recentProjects: [],
  videoSource: null,
  activeView: 'create',
  readyAssets: {feed: '', story: '', reelSlides: [], reelBlob: null, reelMime: '', packageBlob: null},
  reelPreviewTimer: null,
  reelPreviewIndex: 0,
  assetStyleIndex: 0,
  activeAssetTab: 'feed',
  approvedAssets: {feed: false, story: false, reel: false},
};

const els = {
  photoInput: document.getElementById('photoInput'),
  videoInput: document.getElementById('videoInput'),
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
  workerAssets: document.getElementById('workerAssets'),
  feedAssetPreview: document.getElementById('feedAssetPreview'),
  storyAssetPreview: document.getElementById('storyAssetPreview'),
  downloadFeedBtn: document.getElementById('downloadFeedBtn'),
  downloadStoryBtn: document.getElementById('downloadStoryBtn'),
  downloadPackageBtn: document.getElementById('downloadPackageBtn'),
  reelPreview: document.getElementById('reelPreview'),
  reelPreviewImage: document.getElementById('reelPreviewImage'),
  reelPreviewVideo: document.getElementById('reelPreviewVideo'),
  reelPreviewHook: document.getElementById('reelPreviewHook'),
  reelPreviewOverlay: document.getElementById('reelPreviewOverlay'),
  reelProgress: document.getElementById('reelProgress'),
  playReelBtn: document.getElementById('playReelBtn'),
  downloadReelBtn: document.getElementById('downloadReelBtn'),
  reelReadyBadge: document.getElementById('reelReadyBadge'),
  assetStatus: document.getElementById('assetStatus'),
  assetTabs: [...document.querySelectorAll('.asset-tab')],
  assetPanels: [...document.querySelectorAll('.asset-panel')],
  approveBtns: [...document.querySelectorAll('.approve-btn')],
  copyFullPostBtn: document.getElementById('copyFullPostBtn'),
  selectedPhoto: document.getElementById('selectedPhoto'),
  basicEditBtn: document.getElementById('basicEditBtn'),
  aiCleanupBtn: document.getElementById('aiCleanupBtn'),
  format45Btn: document.getElementById('format45Btn'),
  format916Btn: document.getElementById('format916Btn'),
  createPostGraphicBtn: document.getElementById('createPostGraphicBtn'),
  editedPreviewCard: document.getElementById('editedPreviewCard'),
  editedPreviewTitle: document.getElementById('editedPreviewTitle'),
  previewDisplayImage: document.getElementById('previewDisplayImage'),
  downloadEditedBtn: document.getElementById('downloadEditedBtn'),
  editSummary: document.getElementById('editSummary'),
  previewBasicBtn: document.getElementById('previewBasicBtn'),
  previewAiBtn: document.getElementById('previewAiBtn'),
  preview45Btn: document.getElementById('preview45Btn'),
  preview916Btn: document.getElementById('preview916Btn'),
  previewGraphicBtn: document.getElementById('previewGraphicBtn'),
  previewModeBtns: [...document.querySelectorAll('.preview-mode-btn')],
  recentProjectsPanel: document.getElementById('recentProjectsPanel'),
  recentProjectsList: document.getElementById('recentProjectsList'),
  projectsEmpty: document.getElementById('projectsEmpty'),
  clearProjectsBtn: document.getElementById('clearProjectsBtn'),
  detailsToggleBtn: document.getElementById('detailsToggleBtn'),
  toolsEmpty: document.getElementById('toolsEmpty'),
  toolsState: document.getElementById('toolsState'),
  analysisTools: document.getElementById('analysisTools'),
  goCreateFromEmpty: document.getElementById('goCreateFromEmpty'),
  goCreateFromTools: document.getElementById('goCreateFromTools'),
  bottomNavBtns: [...document.querySelectorAll('.bottom-nav-btn')],
  appViews: [...document.querySelectorAll('.app-view')],
  takePhotosBtn: document.getElementById('takePhotosBtn'),
  photoCameraDialog: document.getElementById('photoCameraDialog'),
  photoCameraPreview: document.getElementById('photoCameraPreview'),
  photoCameraStatus: document.getElementById('photoCameraStatus'),
  closePhotoCameraBtn: document.getElementById('closePhotoCameraBtn'),
  photoShutterBtn: document.getElementById('photoShutterBtn'),
  useCapturedPhotosBtn: document.getElementById('useCapturedPhotosBtn'),
  photoCaptureCount: document.getElementById('photoCaptureCount'),
  photoCaptureStrip: document.getElementById('photoCaptureStrip'),
  recordVideoBtn: document.getElementById('recordVideoBtn'),
  cameraDialog: document.getElementById('cameraDialog'),
  cameraPreview: document.getElementById('cameraPreview'),
  cameraStatus: document.getElementById('cameraStatus'),
  closeCameraBtn: document.getElementById('closeCameraBtn'),
  startRecordingBtn: document.getElementById('startRecordingBtn'),
  stopRecordingBtn: document.getElementById('stopRecordingBtn'),
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
let photoCameraStream = null;
let capturedPhotos = [];
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let discardRecording = false;


function makeId(prefix = 'media') {
  return globalThis.crypto?.randomUUID ? `${prefix}-${globalThis.crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function openMediaDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_DB_STORE)) db.createObjectStore(MEDIA_DB_STORE, {keyPath: 'id'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open media storage'));
  });
}

async function saveVideoBlobToDb(id, file) {
  if (!id || !file) return false;
  try {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_DB_STORE, 'readwrite');
      tx.objectStore(MEDIA_DB_STORE).put({id, blob: file, name: file.name || '', type: file.type || 'video/mp4', savedAt: Date.now()});
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Video storage failed'));
    });
    db.close();
    return true;
  } catch (error) {
    console.info('Persistent video storage unavailable', error);
    return false;
  }
}

async function loadVideoBlobFromDb(id) {
  if (!id) return null;
  try {
    const db = await openMediaDb();
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_DB_STORE, 'readonly');
      const request = tx.objectStore(MEDIA_DB_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Video lookup failed'));
    });
    db.close();
    return record?.blob || null;
  } catch (error) {
    console.info('Could not restore stored video', error);
    return null;
  }
}

async function deleteVideoBlobFromDb(id) {
  if (!id) return;
  try {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_DB_STORE, 'readwrite');
      tx.objectStore(MEDIA_DB_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Video delete failed'));
    });
    db.close();
  } catch (error) {
    console.info('Could not remove stored video', error);
  }
}

function releaseCurrentVideoUrl() {
  if (state.videoSource?.objectUrl) {
    try { URL.revokeObjectURL(state.videoSource.objectUrl); } catch {}
  }
  if (els.reelPreviewVideo) {
    try { els.reelPreviewVideo.pause(); } catch {}
    els.reelPreviewVideo.removeAttribute('src');
    els.reelPreviewVideo.load?.();
  }
}

function serializableVideoSource(source = state.videoSource) {
  if (!source) return null;
  return {
    id: source.id || '',
    name: source.name || '',
    duration: Number(source.duration || 0),
    frameCount: Number(source.frameCount || 0),
    type: source.type || '',
    size: Number(source.size || 0),
  };
}

async function hydrateVideoSource(source) {
  if (!source) return null;
  const clean = {...source};
  let blob = clean.blob || null;
  if (!blob && clean.id) blob = await loadVideoBlobFromDb(clean.id);
  if (blob) {
    clean.blob = blob;
    clean.type = clean.type || blob.type || 'video/mp4';
    clean.objectUrl = URL.createObjectURL(blob);
  }
  return clean;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function showAuthNotice(message) {
  els.authNotice.textContent = message;
  els.authNotice.classList.remove('hidden');
  clearTimeout(showAuthNotice.timer);
  showAuthNotice.timer = setTimeout(() => els.authNotice.classList.add('hidden'), 6500);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (c) => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[c]));
}

function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
  } catch {
    return '';
  }
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
    showAuthNotice('Firebase could not initialize.');
  }
}

function renderAuthState() {
  if (!state.user) {
    els.apiStatus.textContent = 'Sign in to connect';
    els.apiStatus.className = 'status-pill demo';
    els.authBtn.textContent = 'Sign in';
    els.userName.classList.add('hidden');
    return;
  }
  els.apiStatus.textContent = 'AI ready';
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

function activateView(viewName, {scroll = true} = {}) {
  state.activeView = viewName;
  els.appViews.forEach((view) => view.classList.toggle('active', view.dataset.view === viewName));
  els.bottomNavBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.viewTarget === viewName));
  if (viewName === 'tools') renderToolsState();
  if (viewName === 'projects') renderRecentProjects();
  if (scroll) window.scrollTo({top: 0, behavior: 'smooth'});
}

els.bottomNavBtns.forEach((btn) => btn.addEventListener('click', () => activateView(btn.dataset.viewTarget)));
els.goCreateFromEmpty.addEventListener('click', () => activateView('create'));
els.goCreateFromTools.addEventListener('click', () => activateView('create'));

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

els.includeReel.addEventListener('change', updateReelModeVisibility);
els.photoInput.addEventListener('change', (event) => addFiles([...event.target.files]));
els.videoInput.addEventListener('change', (event) => addFiles([...event.target.files]));

['dragenter', 'dragover'].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.add('dragging');
  });
});
['dragleave', 'drop'].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove('dragging');
  });
});
els.dropZone.addEventListener('drop', (event) => addFiles([...event.dataTransfer.files]));

async function addFiles(files) {
  const images = files.filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type));
  const videos = files.filter((file) => String(file.type || '').startsWith('video/'));

  const hasAttachedVideo = Boolean(state.videoSource?.blob || state.videoSource?.objectUrl);
  if (videos.length > MAX_VIDEOS || (videos.length && hasAttachedVideo)) {
    showToast('One video per project for now');
  }

  // A project restored from an older build may have analysis frames but not the original
  // video blob. Choosing the video again replaces those old frames and restores moving footage.
  if (videos.length && state.videoSource && !hasAttachedVideo) {
    state.photos = state.photos.filter((photo) => photo.sourceType !== 'videoFrame');
    state.videoSource = null;
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
      showToast('Sampling useful video frames…');
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
      const videoId = makeId('video');
      const persisted = await saveVideoBlobToDb(videoId, file);
      state.videoSource = {
        id: videoId,
        name: file.name,
        duration: extracted.duration,
        frameCount: extracted.frames.length,
        type: file.type || 'video/mp4',
        size: file.size || 0,
        blob: file,
        objectUrl: URL.createObjectURL(file),
        persisted,
      };
      showToast(`Video ready — moving footage kept for Reel + ${extracted.frames.length} analysis frames`);
    } catch (error) {
      console.error(error);
      showAuthNotice('That video could not be sampled. Try a different MP4 or MOV clip.');
    }
  }

  if (!images.length && !videos.length) showToast('Choose a photo or video file');
  if (!slots() && images.length + videos.length > 0) showToast(`Maximum of ${MAX_IMAGES} images/video frames`);

  renderPhotos();
  refreshSelectedPhotoOptions();
  renderToolsState();
  els.photoInput.value = '';
  els.videoInput.value = '';
}

function waitForMediaEvent(target, eventName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 12000);
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(target.error || new Error(`Media error before ${eventName}`)); };
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
    const positions = safeCount === 1 ? [0.5] : Array.from({length: safeCount}, (_, i) => 0.12 + ((0.76 * i) / (safeCount - 1)));
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
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({time: target, dataUrl: canvas.toDataURL('image/jpeg', .84)});
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
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', .84));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  let photoNumber = 0;
  let videoFrameNumber = 0;
  els.photoGrid.innerHTML = state.photos.map((photo, index) => {
    const isVideo = photo.sourceType === 'videoFrame';
    if (isVideo) videoFrameNumber += 1;
    else photoNumber += 1;
    const badge = isVideo ? `VIDEO F${videoFrameNumber}` : `PHOTO ${photoNumber}`;
    const time = isVideo && Number.isFinite(photo.videoTime) ? `<span class="video-time">${photo.videoTime.toFixed(1)}s</span>` : '';
    return `<div class="photo-item">
      <img src="${photo.dataUrl}" alt="${isVideo ? 'Video frame' : 'Photo'} ${index + 1}" />
      <span class="photo-badge">${badge}</span>${time}
      <button class="photo-remove" type="button" data-index="${index}" aria-label="Remove media ${index + 1}">×</button>
    </div>`;
  }).join('');

  els.photoGrid.querySelectorAll('.photo-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.photos.splice(Number(btn.dataset.index), 1);
      if (!state.photos.some((photo) => photo.sourceType === 'videoFrame')) { releaseCurrentVideoUrl(); state.videoSource = null; }
      state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
      clearEditedPreview();
      renderPhotos();
      refreshSelectedPhotoOptions();
      renderToolsState();
    });
  });
}


// In-app multi-shot photo capture (beta). Choosing photos from the iPhone library remains the highest-quality path.
function remainingMediaSlots() {
  return Math.max(0, MAX_IMAGES - state.photos.length);
}

function renderCapturedPhotoStrip() {
  if (!els.photoCaptureStrip) return;
  els.photoCaptureStrip.innerHTML = capturedPhotos.map((dataUrl, index) => `
    <div class="captured-thumb">
      <img src="${dataUrl}" alt="Captured photo ${index + 1}" />
      <button type="button" data-captured-index="${index}" aria-label="Remove captured photo ${index + 1}">×</button>
    </div>
  `).join('');
  els.photoCaptureStrip.querySelectorAll('[data-captured-index]').forEach((button) => {
    button.addEventListener('click', () => {
      capturedPhotos.splice(Number(button.dataset.capturedIndex), 1);
      renderCapturedPhotoStrip();
    });
  });
  const total = capturedPhotos.length;
  els.photoCaptureCount.textContent = `${total} photo${total === 1 ? '' : 's'}`;
  els.useCapturedPhotosBtn.disabled = !total;
  els.photoShutterBtn.disabled = total >= remainingMediaSlots() || remainingMediaSlots() <= 0;
  if (total >= remainingMediaSlots() && remainingMediaSlots() > 0) {
    els.photoCameraStatus.textContent = 'You filled the remaining media slots';
  }
}

function stopPhotoCameraTracks() {
  if (photoCameraStream) photoCameraStream.getTracks().forEach((track) => track.stop());
  photoCameraStream = null;
  if (els.photoCameraPreview) els.photoCameraPreview.srcObject = null;
}

async function applyBestRearCameraConstraints(stream) {
  const track = stream?.getVideoTracks?.()[0];
  if (!track) return;
  try {
    const capabilities = track.getCapabilities?.() || {};
    const advanced = {};
    if (capabilities.zoom && Number.isFinite(capabilities.zoom.min)) advanced.zoom = capabilities.zoom.min;
    if (capabilities.focusMode?.includes?.('continuous')) advanced.focusMode = 'continuous';
    if (capabilities.exposureMode?.includes?.('continuous')) advanced.exposureMode = 'continuous';
    if (Object.keys(advanced).length) await track.applyConstraints({advanced: [advanced]});
  } catch (error) {
    console.info('Optional camera constraints were not available', error);
  }
}

async function openPhotoCamera() {
  const slots = remainingMediaSlots();
  if (!slots) {
    showToast(`Maximum of ${MAX_IMAGES} images/video frames`);
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    showAuthNotice('In-app photo capture is not supported here. Use Choose Photos instead.');
    return;
  }
  capturedPhotos = [];
  renderCapturedPhotoStrip();
  els.photoCameraStatus.textContent = 'Opening rear camera…';
  els.photoCameraDialog.showModal();
  try {
    photoCameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {ideal: 'environment'},
        width: {ideal: 1920},
        height: {ideal: 1440},
        frameRate: {ideal: 30, max: 30},
      },
      audio: false,
    });
    els.photoCameraPreview.srcObject = photoCameraStream;
    await els.photoCameraPreview.play().catch(() => {});
    await applyBestRearCameraConstraints(photoCameraStream);
    els.photoCameraStatus.textContent = `Ready • ${slots} photo${slots === 1 ? '' : 's'} available`;
  } catch (error) {
    console.error(error);
    els.photoCameraStatus.textContent = 'Could not open the camera';
    showAuthNotice('Camera access was unavailable. Take photos in the iPhone Camera app and use Choose Photos instead.');
  }
}

function capturePhotoFromPreview() {
  if (!photoCameraStream || !els.photoCameraPreview?.videoWidth) {
    showToast('Camera is still getting ready');
    return;
  }
  if (capturedPhotos.length >= remainingMediaSlots()) {
    showToast('No more media slots in this project');
    return;
  }
  const video = els.photoCameraPreview;
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedPhotos.push(canvas.toDataURL('image/jpeg', .88));
  els.photoCameraStatus.textContent = 'Captured • move to your next angle';
  renderCapturedPhotoStrip();
}

function closePhotoCamera({usePhotos = false} = {}) {
  if (usePhotos && capturedPhotos.length) {
    capturedPhotos.slice(0, remainingMediaSlots()).forEach((dataUrl, index) => {
      state.photos.push({
        name: `Camera photo ${Date.now()}-${index + 1}.jpg`,
        dataUrl,
        sourceType: 'photo',
      });
    });
    renderPhotos();
    refreshSelectedPhotoOptions();
    renderToolsState();
    showToast(`${capturedPhotos.length} photo${capturedPhotos.length === 1 ? '' : 's'} added`);
  }
  capturedPhotos = [];
  renderCapturedPhotoStrip();
  stopPhotoCameraTracks();
  if (els.photoCameraDialog.open) els.photoCameraDialog.close();
}

els.takePhotosBtn?.addEventListener('click', openPhotoCamera);
els.closePhotoCameraBtn?.addEventListener('click', () => closePhotoCamera({usePhotos: false}));
els.photoShutterBtn?.addEventListener('click', capturePhotoFromPreview);
els.useCapturedPhotosBtn?.addEventListener('click', () => closePhotoCamera({usePhotos: true}));
els.photoCameraDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closePhotoCamera({usePhotos: false});
});
els.photoCameraDialog?.addEventListener('close', () => {
  if (photoCameraStream) stopPhotoCameraTracks();
});

// In-app video recorder (beta). Choosing an existing video remains the recommended path.
async function openCameraRecorder() {
  if (state.videoSource) {
    showToast('This project already has a video');
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    showAuthNotice('Browser recording is not supported here. Record in the Camera app and use Choose Video instead.');
    return;
  }

  discardRecording = false;
  els.cameraStatus.textContent = 'Opening rear camera…';
  els.startRecordingBtn.classList.remove('hidden');
  els.stopRecordingBtn.classList.add('hidden');
  els.cameraDialog.showModal();

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {ideal: 'environment'},
        width: {ideal: 1920},
        height: {ideal: 1080},
        frameRate: {ideal: 30, max: 30},
        aspectRatio: {ideal: 16 / 9},
      },
      audio: true,
    });
    els.cameraPreview.srcObject = cameraStream;
    await els.cameraPreview.play().catch(() => {});

    const videoTrack = cameraStream.getVideoTracks()[0];
    try {
      const capabilities = videoTrack.getCapabilities?.() || {};
      if (capabilities.zoom && Number.isFinite(capabilities.zoom.min)) {
        await videoTrack.applyConstraints({advanced: [{zoom: capabilities.zoom.min}]});
      }
    } catch (constraintError) {
      console.info('Camera zoom constraint not available', constraintError);
    }
    els.cameraStatus.textContent = 'Rear camera ready • hold the phone steady';
  } catch (error) {
    console.error(error);
    els.cameraStatus.textContent = 'Could not open the camera';
    showAuthNotice('Camera access was unavailable. Use Choose Video after recording with the iPhone Camera app.');
  }
}

function stopCameraTracks() {
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  els.cameraPreview.srcObject = null;
}

function closeCameraRecorder({discard = true} = {}) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    discardRecording = discard;
    try { mediaRecorder.stop(); } catch {}
  }
  stopCameraTracks();
  if (els.cameraDialog.open) els.cameraDialog.close();
}

function preferredRecordingMime() {
  const candidates = [
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || '';
}

async function startBrowserRecording() {
  if (!cameraStream) {
    showToast('Camera is still opening');
    return;
  }
  const mimeType = preferredRecordingMime();
  recordedChunks = [];
  discardRecording = false;
  try {
    mediaRecorder = new MediaRecorder(cameraStream, {
      ...(mimeType ? {mimeType} : {}),
      videoBitsPerSecond: 10_000_000,
    });
  } catch {
    mediaRecorder = new MediaRecorder(cameraStream);
  }

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) recordedChunks.push(event.data);
  });
  mediaRecorder.addEventListener('stop', async () => {
    const shouldDiscard = discardRecording;
    const type = mediaRecorder?.mimeType || mimeType || 'video/mp4';
    mediaRecorder = null;
    els.startRecordingBtn.classList.remove('hidden');
    els.stopRecordingBtn.classList.add('hidden');
    if (shouldDiscard || !recordedChunks.length) return;

    const blob = new Blob(recordedChunks, {type});
    const extension = type.includes('webm') ? 'webm' : 'mp4';
    const file = new File([blob], `social-media-pal-recording-${Date.now()}.${extension}`, {type});
    stopCameraTracks();
    if (els.cameraDialog.open) els.cameraDialog.close();
    await addFiles([file]);
  });
  mediaRecorder.start(1000);
  els.cameraStatus.textContent = 'Recording… move slowly and keep the phone steady';
  els.startRecordingBtn.classList.add('hidden');
  els.stopRecordingBtn.classList.remove('hidden');
}

els.recordVideoBtn.addEventListener('click', openCameraRecorder);
els.closeCameraBtn.addEventListener('click', () => closeCameraRecorder({discard: true}));
els.startRecordingBtn.addEventListener('click', startBrowserRecording);
els.stopRecordingBtn.addEventListener('click', () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  discardRecording = false;
  els.cameraStatus.textContent = 'Finishing video…';
  mediaRecorder.stop();
});
els.cameraDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCameraRecorder({discard: true});
});
els.cameraDialog.addEventListener('close', () => {
  if (cameraStream) stopCameraTracks();
});

function setPackageLoading(isLoading, label = '✨ Create Social Package') {
  state.isLoading = isLoading;
  els.generateBtn.disabled = isLoading;
  els.oneTapBtn.disabled = isLoading;
  els.refineBtns.forEach((btn) => {
    btn.disabled = isLoading || !state.result;
    btn.classList.toggle('is-busy', isLoading);
  });
  els.generateLabel.textContent = isLoading ? label : '✨ Create Social Package';
  if (!isLoading) refreshRefineButtons();
}

function refreshRefineButtons() {
  els.refineBtns.forEach((btn) => {
    btn.disabled = state.isLoading || !state.result;
    btn.classList.toggle('ready', Boolean(state.result) && !state.isLoading);
  });
}

function setActivePhotoButton(button, isLoading, loadingText = 'Working…') {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    button.disabled = false;
  }
}

function buildPayload(action = 'generate', refineInstruction = '', extras = {}) {
  const videoFrames = state.photos.filter((photo) => photo.sourceType === 'videoFrame');
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
    images: state.photos.map((photo) => photo.dataUrl),
    mediaManifest: state.photos.map((photo, index) => ({
      imageNumber: index + 1,
      sourceType: photo.sourceType === 'videoFrame' ? 'videoFrame' : 'photo',
      name: photo.name || '',
      videoTime: Number.isFinite(photo.videoTime) ? Number(photo.videoTime.toFixed(2)) : null,
    })),
    videoContext: state.videoSource ? {
      ...serializableVideoSource(state.videoSource),
      frameCount: videoFrames.length,
      frameTimes: videoFrames.map((photo) => Number(photo.videoTime || 0).toFixed(1)),
    } : null,
    currentResult: action === 'refine' ? state.result : undefined,
    refineInstruction: action === 'refine' ? refineInstruction : undefined,
  };
}

async function runPackageRequest(action = 'generate', refineInstruction = '', extras = {}) {
  const description = els.description.value.trim();
  const totalChars = state.photos.reduce((sum, photo) => sum + photo.dataUrl.length, 0);

  if (action === 'generate' && !description && !state.photos.length) {
    showToast('Add a photo/video or tell me what the post is about');
    activateView('create');
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
    showAuthNotice('Sign in with Google first, then create your package.');
    await signIn();
    return;
  }
  if (totalChars > MAX_TOTAL_IMAGE_CHARS) {
    showToast('Those images are too large together. Remove one or two and try again.');
    return;
  }

  const loadingLabel = extras.oneTap ? 'One-Tap is creating…' : action === 'generate' ? 'Creating your package…' : 'Refining your package…';
  setPackageLoading(true, loadingLabel);
  try {
    const response = await generateSocialPackage(buildPayload(action, refineInstruction, extras));
    const data = response?.data || {};
    if (!data.result) throw new Error('No social package was returned.');
    state.result = data.result;
    clearEditedPreview();
    renderResult(data.result);
    await saveCurrentProject();
    els.apiStatus.textContent = 'AI ready';
    els.apiStatus.className = 'status-pill live';
  } catch (error) {
    console.error(error);
    const code = String(error?.code || '');
    if (code.includes('unauthenticated')) showAuthNotice('Your sign-in expired. Sign in again and retry.');
    else if (code.includes('resource-exhausted')) showAuthNotice('The social-content limit was reached. Try again a little later.');
    else if (code.includes('invalid-argument')) showAuthNotice(error?.message || 'Please check the information and media and try again.');
    else showAuthNotice(error?.message || 'The AI request could not be completed.');
  } finally {
    setPackageLoading(false);
  }
}

els.generateBtn.addEventListener('click', () => runPackageRequest('generate'));
els.oneTapBtn.addEventListener('click', () => {
  setOneTapDefaults();
  if (!els.description.value.trim() && state.photos.length) showToast('One-Tap will choose the strongest angle.');
  runPackageRequest('generate', '', {oneTap: true});
});
els.refineBtns.forEach((btn) => btn.addEventListener('click', async () => {
  const instruction = REFINE_INSTRUCTIONS[btn.dataset.refine];
  if (!instruction || btn.disabled) return;
  if (btn.dataset.refine === 'try_another') state.assetStyleIndex = (state.assetStyleIndex + 1) % 3;
  const original = btn.textContent;
  btn.textContent = 'Working…';
  try {
    await runPackageRequest('refine', instruction);
  } finally {
    btn.textContent = original;
    refreshRefineButtons();
  }
}));

function safeText(value, fallback = 'Not generated for this package.') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function renderResult(result) {
  state.approvedAssets = {feed: false, story: false, reel: false};
  activateAssetTab('feed');
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
  renderToolsState();
  refreshRefineButtons();
  activateTab('caption');
  activateView('results');
  queueMicrotask(() => renderWorkerAssets());
}

function renderSequence(id, items, label) {
  const element = document.getElementById(id);
  if (!Array.isArray(items) || !items.length) {
    element.innerHTML = '<div class="formatted-output">Not generated for this package.</div>';
    return;
  }
  element.innerHTML = items.map((item, index) => {
    const title = typeof item === 'string' ? `${label} ${index + 1}` : (item.title || `${label} ${index + 1}`);
    const detail = typeof item === 'string' ? item : (item.detail || item.note || '');
    const overlay = typeof item === 'object' ? (item.overlayText || '') : '';
    const overlayHtml = overlay ? `<div class="overlay-chip"><span>Overlay:</span> ${escapeHtml(overlay)}</div>` : '';
    return `<details class="sequence-item">
      <summary><span class="sequence-index">${index + 1}</span><strong>${escapeHtml(title)}</strong><span class="sequence-chevron">⌄</span></summary>
      <div class="sequence-detail"><p>${escapeHtml(detail)}</p>${overlayHtml}</div>
    </details>`;
  }).join('');
  updateDetailsToggleLabel();
}

function reelDetails() {
  return [...document.querySelectorAll('#reelPlanOutput details.sequence-item')];
}

function updateDetailsToggleLabel() {
  if (!els.detailsToggleBtn) return;
  const details = reelDetails();
  if (!details.length) {
    els.detailsToggleBtn.classList.add('hidden');
    return;
  }
  els.detailsToggleBtn.classList.remove('hidden');
  els.detailsToggleBtn.textContent = details.every((item) => item.open) ? 'Collapse all' : 'Expand all';
}

els.detailsToggleBtn.addEventListener('click', () => {
  const details = reelDetails();
  const shouldOpen = !details.every((item) => item.open);
  details.forEach((item) => { item.open = shouldOpen; });
  updateDetailsToggleLabel();
});
document.addEventListener('toggle', (event) => {
  if (event.target?.matches?.('#reelPlanOutput details.sequence-item')) updateDetailsToggleLabel();
}, true);

function activateTab(name) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  document.querySelectorAll('.result-panel').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== name));
  updateDetailsToggleLabel();
}
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));

const copyMap = {
  caption: 'caption', alternate: 'alternate', hashtags: 'hashtags', postOverlayText: 'postOverlayText',
  reelHook: 'reelHook', overlayText: 'overlayText', story: 'story', storyOverlayText: 'storyOverlayText', cta: 'cta'
};
document.querySelectorAll('.copy-btn').forEach((btn) => {
  if (btn.id === 'downloadEditedBtn' || btn.id === 'detailsToggleBtn') return;
  btn.addEventListener('click', async () => {
    if (!state.result) return;
    let value = state.result[copyMap[btn.dataset.copy]];
    if (Array.isArray(value)) value = value.join(' ');
    await navigator.clipboard.writeText(value || '');
    showToast('Copied');
  });
});

function resetForNewProject() {
  releaseCurrentVideoUrl();
  state.photos = [];
  state.result = null;
  state.videoSource = null;
  state.selectedPhotoIndex = 0;
  state.readyAssets = {feed: '', story: '', reelSlides: [], reelBlob: null, reelMime: '', packageBlob: null};
  state.approvedAssets = {feed: false, story: false, reel: false};
  activateAssetTab('feed');
  stopReelPreview();
  els.workerAssets?.classList.add('hidden');
  els.description.value = '';
  clearEditedPreview();
  renderPhotos();
  refreshSelectedPhotoOptions();
  renderToolsState();
  els.resultsState.classList.add('hidden');
  els.emptyState.classList.remove('hidden');
  activateView('create');
}
els.newBtn.addEventListener('click', resetForNewProject);

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

function renderToolsState() {
  const hasMedia = state.photos.length > 0;
  els.toolsEmpty.classList.toggle('hidden', hasMedia);
  els.toolsState.classList.toggle('hidden', !hasMedia);
  els.analysisTools.classList.toggle('hidden', !state.result);
  if (hasMedia) refreshSelectedPhotoOptions();
}

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
    const frameIndexes = state.photos.map((photo, index) => photo.sourceType === 'videoFrame' ? index : -1).filter((index) => index >= 0);
    if (frameIndexes[frameNumber - 1] !== undefined) return frameIndexes[frameNumber - 1];
  }
  const photoMatch = lead.match(/photo\s*(\d+)/i);
  if (photoMatch) {
    const photoNumber = Math.max(1, Number(photoMatch[1]));
    const photoIndexes = state.photos.map((photo, index) => photo.sourceType !== 'videoFrame' ? index : -1).filter((index) => index >= 0);
    if (photoIndexes[photoNumber - 1] !== undefined) return photoIndexes[photoNumber - 1];
  }
  return Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
}

function clearEditedPreview() {
  state.editedPhotoDataUrl = '';
  state.editedPhotoLabel = '';
  state.originalPreviewDataUrl = '';
  state.previewMode = 'edited';
  els.editedPreviewCard.classList.add('hidden');
  els.previewDisplayImage.removeAttribute('src');
  els.downloadEditedBtn.disabled = true;
  els.editSummary.textContent = '';
}

function renderPreviewMode(mode) {
  state.previewMode = mode;
  els.previewModeBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.previewMode === mode));
  const dataUrl = mode === 'original' ? state.originalPreviewDataUrl : state.editedPhotoDataUrl;
  if (dataUrl) els.previewDisplayImage.src = dataUrl;
}
els.previewModeBtns.forEach((btn) => btn.addEventListener('click', () => renderPreviewMode(btn.dataset.previewMode)));

function showEditedPreview(editedDataUrl, label, summary = '', originalDataUrl = '') {
  const photo = getSelectedPhoto();
  state.originalPreviewDataUrl = originalDataUrl || photo?.dataUrl || editedDataUrl;
  state.editedPhotoDataUrl = editedDataUrl;
  state.editedPhotoLabel = label;
  els.editedPreviewTitle.textContent = label;
  els.editSummary.textContent = summary;
  els.editedPreviewCard.classList.remove('hidden');
  els.downloadEditedBtn.disabled = false;
  renderPreviewMode('edited');
  activateView('tools', {scroll: false});
  requestAnimationFrame(() => els.editedPreviewCard.scrollIntoView({behavior: 'smooth', block: 'start'}));
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
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
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
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
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
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (sourceAspect > targetAspect) {
    sw = img.height * targetAspect;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetAspect;
    sy = Math.max(0, (img.height - sh) * 0.35);
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const style = state.assetStyleIndex % 3;
  const gradient = style === 1
    ? ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    : ctx.createLinearGradient(0, canvas.height * 0.36, 0, canvas.height);
  if (style === 1) {
    gradient.addColorStop(0, 'rgba(0,0,0,.08)');
    gradient.addColorStop(.55, 'rgba(0,0,0,.04)');
    gradient.addColorStop(1, 'rgba(0,0,0,.58)');
  } else if (style === 2) {
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(.48, 'rgba(0,0,0,.12)');
    gradient.addColorStop(1, 'rgba(8,32,25,.82)');
  } else {
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.24)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.76)');
  }
  ctx.fillStyle = gradient;
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
  const y = style === 1 ? Math.max(canvas.height * 0.50, textBottom - textBlockHeight) : Math.max(canvas.height * 0.54, textBottom - textBlockHeight);

  if (style === 2) {
    ctx.fillStyle = 'rgba(19,82,67,.78)';
    ctx.fillRect(left - 24, y - 20, Math.min(maxWidth + 48, canvas.width - left + 24), textBlockHeight + 38);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => ctx.fillText(line, left, y + index * lineHeight));
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.font = `600 ${subFontSize}px Inter, Arial, sans-serif`;
  const footerY = canvas.height - footerBottom - footerHeight;
  footerLines.forEach((line, index) => ctx.fillText(line, left, footerY + index * footerLineHeight));
  return canvas.toDataURL('image/jpeg', 0.95);
}

function photoNoteText(index) {
  const notes = state.result?.visualNotes;
  if (!Array.isArray(notes) || !notes[index]) return '';
  return notes[index]?.detail || notes[index]?.note || '';
}

function dataUrlToFile(dataUrl, filename) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid media data');
  const mime = match[1] || 'application/octet-stream';
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, {type: mime});
}

function requestBrowserDownload(file) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name || 'social-media-pal-file';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function shareOrSaveFile(file, {title = 'Social Media Pal', text = ''} = {}) {
  if (!file) return false;
  const shareData = {files: [file], title, text};
  const canShareFiles = Boolean(navigator.share && navigator.canShare && navigator.canShare(shareData));
  if (canShareFiles) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      console.warn('Native file share failed; falling back to browser download', error);
    }
  }
  requestBrowserDownload(file);
  showAuthNotice('The browser was asked to download the file, but Social Media Pal cannot confirm that iPhone saved it. If nothing appears, use the Save / Share option from Safari.');
  return false;
}

async function shareDataUrlAsset(dataUrl, filename, title) {
  if (!dataUrl) return false;
  try {
    const file = dataUrlToFile(dataUrl, filename);
    return await shareOrSaveFile(file, {title});
  } catch (error) {
    console.error(error);
    showAuthNotice('That finished asset could not be prepared for saving.');
    return false;
  }
}

async function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mediaDimensions(media) {
  const width = media?.videoWidth || media?.naturalWidth || media?.width || 1;
  const height = media?.videoHeight || media?.naturalHeight || media?.height || 1;
  return {width, height};
}

function computeCoverCrop(img, width, height) {
  const targetAspect = width / height;
  const dims = mediaDimensions(img);
  const sourceAspect = dims.width / dims.height;
  if (sourceAspect > targetAspect) {
    const sw = dims.height * targetAspect;
    return {sx: 0, sy: 0, sw, sh: dims.height, maxOffsetX: Math.max(0, dims.width - sw), maxOffsetY: 0};
  }
  const sh = dims.width / targetAspect;
  return {sx: 0, sy: 0, sw: dims.width, sh, maxOffsetX: 0, maxOffsetY: Math.max(0, dims.height - sh)};
}

function drawCoverImage(ctx, img, width, height, zoom = 1, focusY = 0.42) {
  const crop = computeCoverCrop(img, width, height);
  const z = Math.max(1, zoom);
  const zw = crop.sw / z;
  const zh = crop.sh / z;
  const sx = crop.maxOffsetX ? crop.maxOffsetX * 0.5 + (crop.sw - zw) / 2 : (crop.sw - zw) / 2;
  const syBase = crop.maxOffsetY ? crop.maxOffsetY * clamp(focusY, 0, 1) : 0;
  const sy = syBase + (crop.sh - zh) / 2;
  ctx.drawImage(img, sx, sy, zw, zh, 0, 0, width, height);
}

function chooseStoryPhotoIndex(leadIndex) {
  if (!state.photos.length) return 0;
  if (state.photos.length === 1) return 0;

  const verticalIndex = state.photos.findIndex((photo, index) => index !== leadIndex && photo.width && photo.height && photo.height / photo.width > 1.12);
  if (verticalIndex >= 0) return verticalIndex;

  const plan = Array.isArray(state.result?.reelPlan) ? state.result.reelPlan : [];
  for (let i = 0; i < plan.length; i += 1) {
    const idx = parseReelMediaIndex(plan[i], i);
    if (idx !== leadIndex && state.photos[idx]) return idx;
  }

  return (leadIndex + 1) % state.photos.length;
}

function chooseReelMotion(item, photo, index, total) {
  const text = String(typeof item === 'string'
    ? item
    : `${item?.title || ''} ${item?.detail || ''} ${item?.note || ''} ${item?.overlayText || ''}`).toLowerCase();
  const portrait = Boolean(photo?.height && photo?.width && photo.height / photo.width > 1.18);
  const veryWide = Boolean(photo?.width && photo?.height && photo.width / photo.height > 1.35);

  if (/close|detail|label|single|feature|focus|product/.test(text)) return index % 2 ? 'zoom_in_soft' : 'zoom_in';
  if (/wide|shelf|display|range|tour|overview|selection|wall/.test(text)) {
    if (portrait) return index % 2 ? 'pan_down' : 'pan_up';
    return index % 2 ? 'pan_left' : 'pan_right';
  }
  if (/top|upper/.test(text)) return 'pan_up';
  if (/bottom|lower/.test(text)) return 'pan_down';
  if (index === 0) return veryWide ? 'pan_right' : 'zoom_in';
  if (index === total - 1) return portrait ? 'pan_down' : 'zoom_out';
  const fallback = portrait
    ? ['pan_up', 'pan_down', 'still', 'zoom_in_soft']
    : ['pan_left', 'pan_right', 'zoom_in_soft', 'zoom_out', 'still'];
  return fallback[index % fallback.length];
}

function motionPreset(type) {
  const presets = {
    zoom_in: {startZoom: 1.0, endZoom: 1.09, startFocusX: 0.5, endFocusX: 0.5, startFocusY: 0.42, endFocusY: 0.42},
    zoom_in_soft: {startZoom: 1.01, endZoom: 1.06, startFocusX: 0.5, endFocusX: 0.5, startFocusY: 0.44, endFocusY: 0.42},
    zoom_out: {startZoom: 1.1, endZoom: 1.01, startFocusX: 0.5, endFocusX: 0.5, startFocusY: 0.42, endFocusY: 0.42},
    pan_left: {startZoom: 1.07, endZoom: 1.07, startFocusX: 0.7, endFocusX: 0.3, startFocusY: 0.44, endFocusY: 0.44},
    pan_right: {startZoom: 1.07, endZoom: 1.07, startFocusX: 0.3, endFocusX: 0.7, startFocusY: 0.44, endFocusY: 0.44},
    pan_up: {startZoom: 1.06, endZoom: 1.06, startFocusX: 0.5, endFocusX: 0.5, startFocusY: 0.68, endFocusY: 0.3},
    pan_down: {startZoom: 1.06, endZoom: 1.06, startFocusX: 0.5, endFocusX: 0.5, startFocusY: 0.3, endFocusY: 0.68},
    still: {startZoom: 1.02, endZoom: 1.02, startFocusX: 0.5, endFocusX: 0.5, startFocusY: 0.42, endFocusY: 0.42},
  };
  return presets[type] || presets.zoom_in_soft;
}

function interpolateMotion(preset, progress) {
  return {
    zoom: preset.startZoom + (preset.endZoom - preset.startZoom) * progress,
    focusX: preset.startFocusX + (preset.endFocusX - preset.startFocusX) * progress,
    focusY: preset.startFocusY + (preset.endFocusY - preset.startFocusY) * progress,
  };
}

function drawAnimatedCoverImage(ctx, img, width, height, motionType, progress) {
  const preset = motionPreset(motionType);
  const frame = interpolateMotion(preset, clamp(progress, 0, 1));
  const crop = computeCoverCrop(img, width, height);
  const zoom = Math.max(1, frame.zoom);
  const visibleW = crop.sw / zoom;
  const visibleH = crop.sh / zoom;
  const offsetX = crop.maxOffsetX * clamp(frame.focusX, 0, 1);
  const offsetY = crop.maxOffsetY * clamp(frame.focusY, 0, 1);
  const sx = offsetX + (crop.sw - visibleW) / 2;
  const sy = offsetY + (crop.sh - visibleH) / 2;
  ctx.drawImage(img, sx, sy, visibleW, visibleH, 0, 0, width, height);
}

function previewMotionTransforms(motionType) {
  const preset = motionPreset(motionType);
  const start = `translate(${((0.5 - preset.startFocusX) * 14).toFixed(2)}%, ${((0.5 - preset.startFocusY) * 12).toFixed(2)}%) scale(${preset.startZoom.toFixed(3)})`;
  const end = `translate(${((0.5 - preset.endFocusX) * 14).toFixed(2)}%, ${((0.5 - preset.endFocusY) * 12).toFixed(2)}%) scale(${preset.endZoom.toFixed(3)})`;
  return {start, end};
}

function drawTextBlock(ctx, text, x, y, maxWidth, maxLines, fontSize, lineHeight, color = '#fff', weight = 800) {
  let size = fontSize;
  let lines = [];
  do {
    ctx.font = `${weight} ${size}px Inter, Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
    size -= 3;
  } while (size > 30);
  lines = lines.slice(0, maxLines);
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  const lh = Math.round(size * lineHeight);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lh));
  return {height: lines.length * lh, fontSize: size, lines};
}

async function createStoryGraphic(dataUrl) {
  const img = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  drawCoverImage(ctx, img, canvas.width, canvas.height, 1.01, 0.38);

  const style = state.assetStyleIndex % 3;
  const gradient = ctx.createLinearGradient(0, canvas.height * .25, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(.55, style === 1 ? 'rgba(0,0,0,.08)' : 'rgba(0,0,0,.15)');
  gradient.addColorStop(1, style === 2 ? 'rgba(8,32,25,.84)' : 'rgba(0,0,0,.78)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const profile = getProfile();
  const overlay = state.result?.storyOverlayText || state.result?.postOverlayText || state.result?.headline || 'In store now';
  const cta = state.result?.cta || 'Stop in and take a look.';
  const brand = profile.businessName || 'Ocean State Spice & Tea Merchants';
  const left = 72;
  const maxWidth = canvas.width - 144;
  const topY = canvas.height * .64;
  const block = drawTextBlock(ctx, overlay, left, topY, maxWidth, 4, 86, 1.05, '#fff', 850);

  ctx.font = '600 32px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  const ctaLines = wrapText(ctx, cta, maxWidth).slice(0, 3);
  const ctaY = topY + block.height + 38;
  ctaLines.forEach((line, i) => ctx.fillText(line, left, ctaY + i * 42));

  const footerY = canvas.height - 102;
  ctx.font = '700 25px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillText(brand, left, footerY);
  return canvas.toDataURL('image/jpeg', .95);
}

function parseReelMediaIndex(item, fallbackIndex) {
  const text = typeof item === 'string' ? item : `${item?.title || ''} ${item?.detail || item?.note || ''}`;
  let match = text.match(/image\s*(\d+)/i) || text.match(/photo\s*(\d+)/i);
  if (match) return Math.max(0, Math.min(state.photos.length - 1, Number(match[1]) - 1));
  match = text.match(/(?:video\s*)?frame\s*(\d+)/i);
  if (match) {
    const frames = state.photos.map((photo, index) => photo.sourceType === 'videoFrame' ? index : -1).filter((index) => index >= 0);
    const frameIndex = frames[Math.max(0, Number(match[1]) - 1)];
    if (frameIndex !== undefined) return frameIndex;
  }
  return fallbackIndex % Math.max(1, state.photos.length);
}


function reelDurationMs(item) {
  const text = typeof item === 'string' ? item : `${item?.detail || ''} ${item?.note || ''}`;
  const range = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*seconds?/i);
  if (range) {
    const average = (Number(range[1]) + Number(range[2])) / 2;
    return Math.round(Math.min(5, Math.max(1.5, average)) * 1000);
  }
  const single = text.match(/(\d+(?:\.\d+)?)\s*seconds?/i);
  if (single) return Math.round(Math.min(5, Math.max(1.5, Number(single[1]))) * 1000);
  return 2200;
}

function videoSegmentForFrame(photo, requestedMs = 2200) {
  const duration = Number(state.videoSource?.duration || 0);
  if (!duration || !Number.isFinite(photo?.videoTime)) return null;

  const frameTimes = state.photos
    .filter((item) => item.sourceType === 'videoFrame' && Number.isFinite(item.videoTime))
    .map((item) => Number(item.videoTime))
    .sort((a, b) => a - b);
  const current = Number(photo.videoTime);
  const frameIndex = Math.max(0, frameTimes.findIndex((time) => Math.abs(time - current) < 0.03));
  const prev = frameIndex > 0 ? frameTimes[frameIndex - 1] : null;
  const next = frameIndex >= 0 && frameIndex < frameTimes.length - 1 ? frameTimes[frameIndex + 1] : null;

  let lower = prev == null ? 0 : (prev + current) / 2;
  let upper = next == null ? duration : (current + next) / 2;
  if (duration > 1.2 && lower < 0.12) lower = 0.12; // skip the hand-motion that often happens right as recording starts
  if (upper > duration - 0.05) upper = Math.max(lower + 0.25, duration - 0.05);

  const available = Math.max(0.25, upper - lower);
  const requested = clamp(Number(requestedMs || 2200) / 1000, 0.8, 5);
  const target = Math.min(available, requested);
  let start = current - target / 2;
  start = clamp(start, lower, Math.max(lower, upper - target));
  const end = Math.min(duration, start + target);
  return {start, end, duration: Math.max(250, Math.round((end - start) * 1000))};
}

function buildReelSlides() {
  if (!state.photos.length) return [];
  const plan = Array.isArray(state.result?.reelPlan) ? state.result.reelPlan : [];
  const desiredCount = Math.min(6, Math.max(3, plan.length || state.photos.length));
  const hasLiveVideo = Boolean(state.videoSource?.objectUrl || state.videoSource?.blob);
  const nonVideoPhotos = state.photos.filter((photo) => photo.sourceType !== 'videoFrame');
  const videoFrames = state.photos.filter((photo) => photo.sourceType === 'videoFrame');

  // If the project is just one short video, use the real moving clip once rather than
  // turning its three analysis frames into three separate animated stills.
  if (hasLiveVideo && videoFrames.length && !nonVideoPhotos.length && Number(state.videoSource?.duration || 0) <= 8) {
    const duration = Number(state.videoSource.duration || 0);
    const start = duration > 1.2 ? 0.12 : 0;
    const end = Math.max(start + 0.25, duration - 0.05);
    return [{
      dataUrl: videoFrames[Math.floor(videoFrames.length / 2)]?.dataUrl || videoFrames[0].dataUrl,
      overlay: String(state.result?.reelHook || state.result?.overlayText || ''),
      title: 'Original video',
      duration: Math.round((end - start) * 1000),
      sourceIndex: state.photos.indexOf(videoFrames[Math.floor(videoFrames.length / 2)] || videoFrames[0]),
      sourceType: 'video',
      videoStart: start,
      videoEnd: end,
      motionType: 'video',
    }];
  }

  const slides = [];
  const usedVideoWindows = [];
  for (let i = 0; i < desiredCount; i += 1) {
    const item = plan[i] || null;
    const mediaIndex = parseReelMediaIndex(item, i);
    const photo = state.photos[mediaIndex] || state.photos[i % state.photos.length];
    const overlay = typeof item === 'object' && item?.overlayText
      ? item.overlayText
      : (i === 0 ? state.result?.reelHook : state.result?.overlayText) || state.result?.postOverlayText || '';
    const requestedDuration = reelDurationMs(item);

    if (photo?.sourceType === 'videoFrame' && hasLiveVideo) {
      const segment = videoSegmentForFrame(photo, requestedDuration);
      if (segment) {
        const duplicate = usedVideoWindows.some((window) => Math.abs(window.start - segment.start) < 0.18 && Math.abs(window.end - segment.end) < 0.18);
        if (!duplicate) {
          usedVideoWindows.push(segment);
          slides.push({
            dataUrl: photo.dataUrl,
            overlay: String(overlay || ''),
            title: typeof item === 'object' ? String(item.title || '') : '',
            duration: segment.duration,
            sourceIndex: mediaIndex,
            sourceType: 'video',
            videoStart: segment.start,
            videoEnd: segment.end,
            motionType: 'video',
          });
        }
        continue;
      }
    }

    slides.push({
      dataUrl: photo.dataUrl,
      overlay: String(overlay || ''),
      title: typeof item === 'object' ? String(item.title || '') : '',
      duration: requestedDuration,
      sourceIndex: mediaIndex,
      sourceType: 'photo',
      motionType: chooseReelMotion(item, photo, i, desiredCount),
    });
  }

  // Ensure a real video project actually contributes moving footage even if the AI plan
  // happened to reference only a photo-number wording.
  if (hasLiveVideo && videoFrames.length && !slides.some((slide) => slide.sourceType === 'video')) {
    const frame = videoFrames[Math.floor(videoFrames.length / 2)];
    const segment = videoSegmentForFrame(frame, 2400);
    if (segment) {
      slides.splice(Math.min(1, slides.length), 0, {
        dataUrl: frame.dataUrl,
        overlay: String(state.result?.overlayText || ''),
        title: 'Video clip',
        duration: segment.duration,
        sourceIndex: state.photos.indexOf(frame),
        sourceType: 'video',
        videoStart: segment.start,
        videoEnd: segment.end,
        motionType: 'video',
      });
    }
  }

  return slides.slice(0, 6);
}

function stopReelPreview() {
  if (state.reelPreviewTimer) clearTimeout(state.reelPreviewTimer);
  state.reelPreviewTimer = null;
  els.playReelBtn.textContent = '▶ Play preview';
  els.reelPreview.classList.remove('playing');
  try { els.reelPreviewVideo?.pause(); } catch {}
}

function showReelSlide(index, animate = true) {
  const slides = state.readyAssets.reelSlides || [];
  if (!slides.length) return;
  const slide = slides[index % slides.length];
  state.reelPreviewIndex = index % slides.length;
  els.reelPreviewHook.textContent = state.reelPreviewIndex === 0 ? (state.result?.reelHook || '') : '';
  els.reelPreviewOverlay.textContent = slide.overlay || '';
  els.reelProgress.style.width = `${((state.reelPreviewIndex + 1) / slides.length) * 100}%`;

  if (slide.sourceType === 'video' && state.videoSource?.objectUrl && els.reelPreviewVideo) {
    els.reelPreviewImage.classList.add('hidden');
    els.reelPreviewVideo.classList.remove('hidden');
    if (els.reelPreviewVideo.src !== state.videoSource.objectUrl) els.reelPreviewVideo.src = state.videoSource.objectUrl;
    const begin = () => {
      try { els.reelPreviewVideo.currentTime = Math.max(0, Number(slide.videoStart || 0)); } catch {}
      if (animate) els.reelPreviewVideo.play().catch(() => {});
      else els.reelPreviewVideo.pause();
    };
    if (els.reelPreviewVideo.readyState >= 1) begin();
    else els.reelPreviewVideo.addEventListener('loadedmetadata', begin, {once: true});
    return;
  }

  if (els.reelPreviewVideo) {
    try { els.reelPreviewVideo.pause(); } catch {}
    els.reelPreviewVideo.classList.add('hidden');
  }
  els.reelPreviewImage.classList.remove('hidden');
  els.reelPreviewImage.classList.remove('scene-enter');
  const previewMotion = previewMotionTransforms(slide.motionType);
  els.reelPreviewImage.style.setProperty('--reel-start-transform', previewMotion.start);
  els.reelPreviewImage.style.setProperty('--reel-end-transform', previewMotion.end);
  els.reelPreviewImage.style.setProperty('--reel-duration', `${Math.max(1200, slide.duration)}ms`);
  els.reelPreviewImage.src = slide.dataUrl;
  if (animate) requestAnimationFrame(() => els.reelPreviewImage.classList.add('scene-enter'));
}

function playReelPreview() {
  const slides = state.readyAssets.reelSlides || [];
  if (!slides.length) return;
  if (state.reelPreviewTimer) {
    stopReelPreview();
    return;
  }
  els.playReelBtn.textContent = '■ Stop preview';
  els.reelPreview.classList.add('playing');
  let index = 0;
  const advance = () => {
    showReelSlide(index, true);
    index += 1;
    if (index >= slides.length) {
      state.reelPreviewTimer = setTimeout(() => {
        stopReelPreview();
        showReelSlide(0, false);
      }, slides[slides.length - 1].duration);
      return;
    }
    state.reelPreviewTimer = setTimeout(advance, slides[index - 1].duration);
  };
  advance();
}

function chooseRecordingMimeType() {
  const types = [
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  return types.find((type) => globalThis.MediaRecorder?.isTypeSupported?.(type)) || '';
}

function drawReelCanvasFrame(ctx, img, slide, progress, width, height) {
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);
  // Keep the exported Reel clean. Suggested hook/overlay text remains in the
  // app as reference only so the user can add final text while posting.
  drawAnimatedCoverImage(ctx, img, width, height, slide?.motionType || 'zoom_in_soft', progress);
  ctx.restore();
}


async function createSourceVideoElement() {
  const src = state.videoSource?.objectUrl;
  if (!src) return null;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = src;
  if (video.readyState < 1) await waitForMediaEvent(video, 'loadedmetadata');
  if (video.readyState < 2) await waitForMediaEvent(video, 'loadeddata').catch(() => {});
  return video;
}

async function seekVideoElement(video, time) {
  const target = Math.max(0, Math.min(Number(time || 0), Math.max(0, Number(video.duration || 0) - 0.03)));
  if (Math.abs(Number(video.currentTime || 0) - target) < 0.03) return;
  video.currentTime = target;
  await waitForMediaEvent(video, 'seeked');
}

async function renderOriginalVideoSegment(ctx, video, slide, width, height) {
  const startSec = Math.max(0, Number(slide.videoStart || 0));
  const endSec = Math.max(startSec + 0.15, Number(slide.videoEnd || startSec + (slide.duration || 1000) / 1000));
  await seekVideoElement(video, startSec);
  video.playbackRate = 1;
  await video.play().catch(() => {});
  const segmentMs = Math.max(150, (endSec - startSec) * 1000);
  const started = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / segmentMs);
      ctx.save();
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, width, height);
      drawCoverImage(ctx, video, width, height, 1.0, .42);
      ctx.restore();
      if (progress < 1 && Number(video.currentTime || 0) < endSec - 0.015) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  video.pause();
}

async function exportReelVideo({returnBlob = false} = {}) {
  const slides = state.readyAssets.reelSlides || [];
  if (!slides.length) {
    showToast('Create a package with media first');
    return null;
  }
  if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    showAuthNotice('This browser can preview the Reel but cannot export video. Try the latest Safari or Chrome on desktop.');
    return null;
  }
  const mimeType = chooseRecordingMimeType();
  if (!mimeType) {
    showAuthNotice('Video export is not supported by this browser yet.');
    return null;
  }
  els.downloadReelBtn.disabled = true;
  els.downloadReelBtn.textContent = 'Rendering Reel…';
  els.reelReadyBadge.textContent = 'Rendering';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    const fps = 24;
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {mimeType, videoBitsPerSecond: 5_000_000});
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
    const stopped = new Promise((resolve) => recorder.addEventListener('stop', resolve, {once: true}));
    recorder.start(500);

    const loaded = await Promise.all(slides.map((slide) => slide.sourceType === 'video' ? null : loadImageFromDataUrl(slide.dataUrl)));
    const sourceVideo = slides.some((slide) => slide.sourceType === 'video') ? await createSourceVideoElement() : null;
    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      if (slide.sourceType === 'video' && sourceVideo) {
        await renderOriginalVideoSegment(ctx, sourceVideo, slide, canvas.width, canvas.height);
        continue;
      }
      const img = loaded[i] || await loadImageFromDataUrl(slide.dataUrl);
      const start = performance.now();
      await new Promise((resolve) => {
        const tick = (now) => {
          const progress = Math.min(1, (now - start) / slide.duration);
          drawReelCanvasFrame(ctx, img, slide, progress, canvas.width, canvas.height);
          if (progress < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    }
    if (sourceVideo) {
      try { sourceVideo.pause(); } catch {}
      sourceVideo.removeAttribute('src');
      sourceVideo.load?.();
    }
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, {type: mimeType});
    state.readyAssets.reelBlob = blob;
    state.readyAssets.reelMime = mimeType;
    els.reelReadyBadge.textContent = 'Ready';
    if (!returnBlob) {
      els.reelReadyBadge.textContent = 'Ready to save';
      els.downloadReelBtn.textContent = 'Save / Share Reel';
      showToast('Reel ready — tap Save / Share Reel');
    }
    return blob;
  } catch (error) {
    console.error(error);
    showAuthNotice('The Reel preview is ready, but video export failed on this device.');
    return null;
  } finally {
    els.downloadReelBtn.disabled = false;
    if (state.readyAssets.reelBlob) {
      els.downloadReelBtn.textContent = 'Save / Share Reel';
      if (els.reelReadyBadge.textContent !== 'Ready to save') els.reelReadyBadge.textContent = 'Ready to save';
    } else {
      els.downloadReelBtn.textContent = 'Render Reel';
      if (els.reelReadyBadge.textContent !== 'Ready') els.reelReadyBadge.textContent = 'Preview ready';
    }
  }
}


function activateAssetTab(name) {
  state.activeAssetTab = name;
  els.assetTabs?.forEach((button) => button.classList.toggle('active', button.dataset.assetTab === name));
  els.assetPanels?.forEach((panel) => panel.classList.toggle('active', panel.dataset.assetPanel === name));
  if (name !== 'reel') stopReelPreview();
}

function refreshApprovalButtons() {
  els.approveBtns?.forEach((button) => {
    const key = button.dataset.approve;
    const approved = Boolean(state.approvedAssets?.[key]);
    button.classList.toggle('approved', approved);
    button.textContent = approved ? '✓ Approved' : '✓ Approve';
  });
}

els.assetTabs?.forEach((button) => button.addEventListener('click', () => activateAssetTab(button.dataset.assetTab)));
els.approveBtns?.forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.approve;
  if (!key) return;
  state.approvedAssets[key] = !state.approvedAssets[key];
  refreshApprovalButtons();
  showToast(state.approvedAssets[key] ? `${key === 'feed' ? 'Post' : key === 'story' ? 'Story' : 'Reel'} approved` : 'Approval removed');
}));

async function renderWorkerAssets() {
  if (!state.result || !state.photos.length || !els.workerAssets) {
    els.workerAssets?.classList.add('hidden');
    return;
  }
  stopReelPreview();
  els.workerAssets.classList.remove('hidden');
  els.assetStatus.textContent = 'Social Media Pal is finishing your media…';
  els.assetStatus.classList.remove('hidden');
  els.downloadFeedBtn.disabled = true;
  els.downloadStoryBtn.disabled = true;
  els.downloadPackageBtn.disabled = true;
  els.downloadReelBtn.disabled = true;
  try {
    const leadIndex = leadPhotoIndex();
    const storyIndex = chooseStoryPhotoIndex(leadIndex);
    const leadPhoto = state.photos[leadIndex] || state.photos[0];
    const storyPhoto = state.photos[storyIndex] || leadPhoto;
    const [enhancedFeed, enhancedStory] = await Promise.all([
      createLocalEditedPhoto(leadPhoto.dataUrl, safeAiEditOptions(photoNoteText(leadIndex))),
      createLocalEditedPhoto(storyPhoto.dataUrl, safeAiEditOptions(photoNoteText(storyIndex))),
    ]);
    const [feed, story] = await Promise.all([
      createPostGraphic(enhancedFeed),
      createStoryGraphic(enhancedStory),
    ]);
    state.readyAssets.feed = feed;
    state.readyAssets.story = story;
    state.readyAssets.reelSlides = buildReelSlides();
    state.readyAssets.reelBlob = null;
    state.readyAssets.reelMime = '';
    state.readyAssets.packageBlob = null;
    els.feedAssetPreview.src = feed;
    els.storyAssetPreview.src = story;
    if (state.readyAssets.reelSlides.length) showReelSlide(0, false);
    els.downloadFeedBtn.disabled = false;
    els.downloadStoryBtn.disabled = false;
    els.downloadPackageBtn.disabled = false;
    els.downloadFeedBtn.textContent = 'Save / Share Post';
    els.downloadStoryBtn.textContent = 'Save / Share Story';
    els.downloadPackageBtn.textContent = 'Prepare package';
    els.downloadReelBtn.disabled = !state.readyAssets.reelSlides.length;
    els.downloadReelBtn.textContent = state.readyAssets.reelSlides.length ? 'Render Reel' : 'Reel unavailable';
    activateAssetTab(state.activeAssetTab || 'feed');
    refreshApprovalButtons();
    els.assetStatus.textContent = 'Finished automatically with Preserve Reality. Your originals are untouched.';
  } catch (error) {
    console.error('Worker asset build failed', error);
    els.assetStatus.textContent = 'The writing is ready, but one of the finished media assets could not be built on this device.';
  }
}

async function prepareWorkerPackage() {
  if (!state.readyAssets.feed || !state.readyAssets.story) return;

  if (state.readyAssets.packageBlob) {
    const file = new File([state.readyAssets.packageBlob], 'social-media-pal-content-package.zip', {type: 'application/zip'});
    await shareOrSaveFile(file, {title: 'Social Media Pal content package'});
    return;
  }

  if (!globalThis.JSZip) {
    showAuthNotice('Package ZIP creation is not available on this device. Save the Post and Story separately using their Save / Share buttons.');
    return;
  }

  els.downloadPackageBtn.disabled = true;
  els.downloadPackageBtn.textContent = 'Building package…';
  try {
    const zip = new JSZip();
    if (!state.readyAssets.reelBlob && state.readyAssets.reelSlides?.length && globalThis.MediaRecorder && HTMLCanvasElement.prototype.captureStream) {
      els.downloadPackageBtn.textContent = 'Rendering Reel…';
      await exportReelVideo({returnBlob: true});
      els.downloadPackageBtn.textContent = 'Building package…';
    }
    const feedBlob = await dataUrlToBlob(state.readyAssets.feed);
    const storyBlob = await dataUrlToBlob(state.readyAssets.story);
    zip.file('01-feed-post-4x5.jpg', feedBlob);
    zip.file('02-story-9x16.jpg', storyBlob);
    const hashtags = Array.isArray(state.result?.hashtags) ? state.result.hashtags.join(' ') : (state.result?.hashtags || '');
    const copyText = [
      'PRIMARY CAPTION', state.result?.caption || '', '',
      'SHORT ALTERNATE', state.result?.alternate || '', '',
      'HASHTAGS', hashtags, '',
      'POST OVERLAY', state.result?.postOverlayText || '', '',
      'STORY COPY', state.result?.story || '', '',
      'CALL TO ACTION', state.result?.cta || ''
    ].join('\n');
    zip.file('03-copy-and-captions.txt', copyText);
    if (state.readyAssets.reelBlob) {
      const ext = state.readyAssets.reelMime.includes('mp4') ? 'mp4' : 'webm';
      zip.file(`04-reel.${ext}`, state.readyAssets.reelBlob);
    } else {
      zip.file('04-reel-note.txt', 'Your Reel preview is assembled in Social Media Pal. Render the Reel in the app, then use Save / Share Reel.');
    }
    zip.file('README.txt', 'Social Media Pal Worker Mode package. Feed and Story graphics preserve the uploaded products, labels and logos; the source photos were not regenerated.');
    const blob = await zip.generateAsync({type: 'blob', compression: 'DEFLATE', compressionOptions: {level: 6}});
    state.readyAssets.packageBlob = blob;
    els.downloadPackageBtn.textContent = 'Save / Share Package';
    showToast('Package ready — tap Save / Share Package');
  } catch (error) {
    console.error(error);
    showAuthNotice('The package could not be built on this device. You can still save each finished asset separately.');
    els.downloadPackageBtn.textContent = 'Prepare package';
  } finally {
    els.downloadPackageBtn.disabled = false;
  }
}

els.downloadFeedBtn?.addEventListener('click', () => shareDataUrlAsset(state.readyAssets.feed, 'social-media-pal-feed-post.jpg', 'Social Media Pal feed post'));
els.downloadStoryBtn?.addEventListener('click', () => shareDataUrlAsset(state.readyAssets.story, 'social-media-pal-story.jpg', 'Social Media Pal Story'));
els.playReelBtn?.addEventListener('click', playReelPreview);
els.downloadReelBtn?.addEventListener('click', async () => {
  if (!state.readyAssets.reelBlob) {
    await exportReelVideo({returnBlob: false});
    return;
  }
  const ext = state.readyAssets.reelMime.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([state.readyAssets.reelBlob], `social-media-pal-reel.${ext}`, {type: state.readyAssets.reelMime || state.readyAssets.reelBlob.type || 'video/mp4'});
  await shareOrSaveFile(file, {title: 'Social Media Pal Reel'});
});
els.downloadPackageBtn?.addEventListener('click', prepareWorkerPackage);

els.copyFullPostBtn?.addEventListener('click', async () => {
  if (!state.result) return;
  const hashtags = Array.isArray(state.result.hashtags) ? state.result.hashtags.join(' ') : (state.result.hashtags || '');
  await navigator.clipboard.writeText([state.result.caption || '', hashtags].filter(Boolean).join('\n\n'));
  showToast('Post + hashtags copied');
});

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
    summary = 'Tighter crop plus modest light, contrast and color improvements. Your original products and labels stay intact.';
    options = {mode: 'basic'};
  } else if (tool === '4x5') {
    label = '4:5 post version';
    summary = 'Reframed your original photo to a 4:5 feed post with a small light and color lift.';
    options = {mode: 'format', targetAspect: 4 / 5};
  } else if (tool === '9x16') {
    label = '9:16 story/reel version';
    summary = 'Reframed your original photo to a 9:16 vertical Story/Reel format with a small light and color lift.';
    options = {mode: 'format', targetAspect: 9 / 16};
  } else if (tool === 'postGraphic') {
    if (!state.result) {
      showToast('Create a package first so there is overlay text to use');
      return;
    }
    label = '4:5 post graphic';
    summary = 'Ready-made 4:5 graphic using your original image and suggested overlay text.';
    originalDataUrl = state.photos[leadPhotoIndex()]?.dataUrl || photo.dataUrl;
  }

  setActivePhotoButton(sourceButton, true, tool === 'postGraphic' ? 'Building…' : 'Working…');
  try {
    const edited = tool === 'postGraphic' ? await createPostGraphic(originalDataUrl) : await createLocalEditedPhoto(photo.dataUrl, options);
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
    const edited = await createLocalEditedPhoto(photo.dataUrl, safeAiEditOptions(selectedPhotoNoteText()));
    showEditedPreview(edited, 'AI recommended edit — Preserve Reality', 'Used the AI photo notes to choose a safe crop and light/color polish. This is non-generative and does not redraw merchandise, labels, logos or packaging.');
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

els.downloadEditedBtn.addEventListener('click', async () => {
  if (!state.editedPhotoDataUrl) return;
  const safeLabel = (state.editedPhotoLabel || 'edited-photo').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await shareDataUrlAsset(state.editedPhotoDataUrl, `${safeLabel || 'edited-photo'}.jpg`, state.editedPhotoLabel || 'Social Media Pal edited photo');
});

async function compressDataUrlForHistory(dataUrl) {
  try {
    const img = await loadImageFromDataUrl(dataUrl);
    const maxSide = 520;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.62);
  } catch {
    return '';
  }
}

async function currentProjectSnapshot() {
  const historyPhotos = await Promise.all(state.photos.map(async (photo) => ({...photo, dataUrl: await compressDataUrlForHistory(photo.dataUrl)})));
  return {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    videoSource: serializableVideoSource(state.videoSource),
    result: state.result,
    historyMediaCompressed: true,
  };
}

async function saveCurrentProject() {
  if (!state.result) return;
  const snapshot = await currentProjectSnapshot();
  const deduped = state.recentProjects.filter((item) => !(item.headline === snapshot.headline && item.description === snapshot.description));
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
      try { save(trimmed); saved = true; } catch {}
    }
    if (!saved) {
      try {
        save([{...snapshot, photos: [], videoSource: null}]);
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
    const legacyRaw = localStorage.getItem('socialStudioRecentProjectsV14') || localStorage.getItem('socialStudioRecentProjectsV12') || localStorage.getItem('socialStudioRecentProjectsV11') || localStorage.getItem('socialStudioRecentProjectsV10') || localStorage.getItem('socialStudioRecentProjectsV09') || localStorage.getItem('socialStudioRecentProjectsV08');
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
  els.projectsEmpty.classList.toggle('hidden', Boolean(list.length));
  els.recentProjectsList.innerHTML = list.map((project) => {
    const projectPhotos = Array.isArray(project.photos) ? project.photos : [];
    const photoCount = projectPhotos.filter((photo) => photo.sourceType !== 'videoFrame').length;
    const frameCount = projectPhotos.filter((photo) => photo.sourceType === 'videoFrame').length;
    const mediaBits = [];
    if (photoCount) mediaBits.push(`${photoCount} photo${photoCount === 1 ? '' : 's'}`);
    if (project.videoSource) mediaBits.push(`video${frameCount ? ` • ${frameCount} analysis frame${frameCount === 1 ? '' : 's'}` : ''}`);
    if (!mediaBits.length) mediaBits.push('saved content');
    return `<div class="recent-project">
      <button class="recent-project-open" type="button" data-project-id="${project.id}">
        <div class="recent-project-icon">${project.videoSource ? '🎞️' : '📷'}</div>
        <div><div class="recent-project-title">${escapeHtml(project.headline || 'Untitled project')}</div><div class="recent-project-meta">${escapeHtml(formatDateTime(project.createdAt))} • ${mediaBits.join(' • ')}</div></div>
        <span class="recent-project-arrow">›</span>
      </button>
      <button class="recent-project-delete" type="button" data-delete-project-id="${project.id}" aria-label="Delete ${escapeHtml(project.headline || 'project')}">🗑️</button>
    </div>`;
  }).join('');
  els.recentProjectsList.querySelectorAll('[data-project-id]').forEach((btn) => btn.addEventListener('click', () => loadProject(btn.dataset.projectId)));
  els.recentProjectsList.querySelectorAll('[data-delete-project-id]').forEach((btn) => btn.addEventListener('click', async () => {
    const projectId = btn.dataset.deleteProjectId;
    const project = state.recentProjects.find((item) => item.id === projectId);
    if (!project) return;
    if (!window.confirm(`Delete “${project.headline || 'this project'}”?`)) return;
    state.recentProjects = state.recentProjects.filter((item) => item.id !== projectId);
    try { localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(state.recentProjects)); } catch {}
    const videoId = project.videoSource?.id;
    if (videoId && !state.recentProjects.some((item) => item.videoSource?.id === videoId)) await deleteVideoBlobFromDb(videoId);
    renderRecentProjects();
    showToast('Project deleted');
  }));
}

async function applyProject(project) {
  if (!project) return;
  releaseCurrentVideoUrl();
  state.photos = Array.isArray(project.photos) ? project.photos : [];
  state.videoSource = project.videoSource ? await hydrateVideoSource(project.videoSource) : null;
  state.result = project.result || null;
  state.readyAssets = {feed: '', story: '', reelSlides: [], reelBlob: null, reelMime: '', packageBlob: null};
  stopReelPreview();
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
  renderToolsState();
  if (state.result) renderResult(state.result);
  else {
    els.resultsState.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
    activateView('create');
  }
  if (project.videoSource && !state.videoSource?.blob) showAuthNotice('Project loaded. The saved analysis frames are available, but the original video file could not be restored; choose the video again to rebuild a moving-footage Reel.');
  else showToast('Project loaded');
}

async function loadProject(projectId) {
  await applyProject(state.recentProjects.find((item) => item.id === projectId));
}

els.clearProjectsBtn.addEventListener('click', async () => {
  if (state.recentProjects.length && !window.confirm('Delete all recent projects?')) return;
  const videoIds = state.recentProjects.map((project) => project.videoSource?.id).filter(Boolean);
  state.recentProjects = [];
  ['socialStudioRecentProjectsV15', 'socialStudioRecentProjectsV14', 'socialStudioRecentProjectsV12', 'socialStudioRecentProjectsV11', 'socialStudioRecentProjectsV10', 'socialStudioRecentProjectsV09', 'socialStudioRecentProjectsV08'].forEach((key) => localStorage.removeItem(key));
  await Promise.all(videoIds.map((id) => deleteVideoBlobFromDb(id)));
  renderRecentProjects();
  showToast('Recent projects cleared');
});

loadProfile();
loadRecentProjects();
updateReelModeVisibility();
refreshSelectedPhotoOptions();
renderToolsState();
refreshRefineButtons();
activateView('create', {scroll: false});
initFirebase();
