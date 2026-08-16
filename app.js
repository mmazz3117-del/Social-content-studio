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
const PROJECTS_STORAGE_KEY = 'socialStudioRecentProjectsV11';
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
  originalPreviewDataUrl: '',
  previewMode: 'edited',
  recentProjects: [],
  videoSource: null,
  activeView: 'create',
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
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let discardRecording = false;

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

  if (videos.length > MAX_VIDEOS || (videos.length && state.videoSource)) {
    showToast('One video per project for now');
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
      state.videoSource = {name: file.name, duration: extracted.duration, frameCount: extracted.frames.length};
      showToast(`Video ready — ${extracted.frames.length} frames sampled`);
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
      if (!state.photos.some((photo) => photo.sourceType === 'videoFrame')) state.videoSource = null;
      state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
      clearEditedPreview();
      renderPhotos();
      refreshSelectedPhotoOptions();
      renderToolsState();
    });
  });
}

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
    const file = new File([blob], `social-studio-recording-${Date.now()}.${extension}`, {type});
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
  els.refineBtns.forEach((btn) => { btn.disabled = isLoading; });
  els.generateLabel.textContent = isLoading ? label : '✨ Create Social Package';
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
      ...state.videoSource,
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
els.refineBtns.forEach((btn) => btn.addEventListener('click', () => {
  const instruction = REFINE_INSTRUCTIONS[btn.dataset.refine];
  if (instruction) runPackageRequest('refine', instruction);
}));

function safeText(value, fallback = 'Not generated for this package.') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
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
  renderToolsState();
  activateTab('caption');
  activateView('results');
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
  state.photos = [];
  state.result = null;
  state.videoSource = null;
  state.selectedPhotoIndex = 0;
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
  const gradient = ctx.createLinearGradient(0, canvas.height * 0.40, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.24)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.76)');
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
  const y = Math.max(canvas.height * 0.54, textBottom - textBlockHeight);

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

els.downloadEditedBtn.addEventListener('click', () => {
  if (!state.editedPhotoDataUrl) return;
  const anchor = document.createElement('a');
  const safeLabel = (state.editedPhotoLabel || 'edited-photo').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  anchor.href = state.editedPhotoDataUrl;
  anchor.download = `${safeLabel || 'edited-photo'}.jpg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
    videoSource: state.videoSource,
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
    const legacyRaw = localStorage.getItem('socialStudioRecentProjectsV10') || localStorage.getItem('socialStudioRecentProjectsV09') || localStorage.getItem('socialStudioRecentProjectsV08');
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
    if (project.videoSource) mediaBits.push(`video${frameCount ? ` • ${frameCount} frame${frameCount === 1 ? '' : 's'}` : ''}`);
    if (!mediaBits.length) mediaBits.push('saved content');
    return `<button class="recent-project" type="button" data-project-id="${project.id}">
      <div class="recent-project-icon">${project.videoSource ? '🎞️' : '📷'}</div>
      <div><div class="recent-project-title">${escapeHtml(project.headline || 'Untitled project')}</div><div class="recent-project-meta">${escapeHtml(formatDateTime(project.createdAt))} • ${mediaBits.join(' • ')}</div></div>
      <span class="recent-project-arrow">›</span>
    </button>`;
  }).join('');
  els.recentProjectsList.querySelectorAll('[data-project-id]').forEach((btn) => btn.addEventListener('click', () => loadProject(btn.dataset.projectId)));
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
  renderToolsState();
  if (state.result) renderResult(state.result);
  else {
    els.resultsState.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
    activateView('create');
  }
  showToast('Project loaded');
}

function loadProject(projectId) {
  applyProject(state.recentProjects.find((item) => item.id === projectId));
}

els.clearProjectsBtn.addEventListener('click', () => {
  state.recentProjects = [];
  ['socialStudioRecentProjectsV11', 'socialStudioRecentProjectsV10', 'socialStudioRecentProjectsV09', 'socialStudioRecentProjectsV08'].forEach((key) => localStorage.removeItem(key));
  renderRecentProjects();
  showToast('Recent projects cleared');
});

loadProfile();
loadRecentProjects();
updateReelModeVisibility();
refreshSelectedPhotoOptions();
renderToolsState();
activateView('create', {scroll: false});
initFirebase();
