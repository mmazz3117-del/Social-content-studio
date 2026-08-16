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
const MAX_TOTAL_IMAGE_CHARS = 12_000_000;
const PROJECTS_STORAGE_KEY = 'socialStudioRecentProjectsV08';
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
  const accepted = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
  const slots = Math.max(0, MAX_IMAGES - state.photos.length);
  if (!slots) {
    showToast(`Maximum of ${MAX_IMAGES} photos`);
    return;
  }

  for (const file of accepted.slice(0, slots)) {
    try {
      const optimized = await optimizeImage(file);
      state.photos.push({name: file.name, dataUrl: optimized});
    } catch {
      showToast(`Could not read ${file.name}`);
    }
  }
  renderPhotos();
  refreshSelectedPhotoOptions();
  els.photoInput.value = '';
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
  els.photoGrid.innerHTML = state.photos.map((photo, i) => `
    <div class="photo-item">
      <img src="${photo.dataUrl}" alt="Photo ${i + 1}" />
      <span class="photo-badge">PHOTO ${i + 1}</span>
      <button class="photo-remove" type="button" data-index="${i}" aria-label="Remove photo ${i + 1}">×</button>
    </div>
  `).join('');

  els.photoGrid.querySelectorAll('.photo-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.photos.splice(Number(btn.dataset.index), 1);
      state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
      clearEditedPreview();
      renderPhotos();
      refreshSelectedPhotoOptions();
    });
  });
}

function setPackageLoading(isLoading, label = 'Create Social Package') {
  state.isLoading = isLoading;
  els.generateBtn.disabled = isLoading;
  els.oneTapBtn.disabled = isLoading;
  els.refineBtns.forEach((btn) => { btn.disabled = isLoading; });
  els.generateLabel.textContent = isLoading ? label : 'Create Social Package';
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
    saveCurrentProject();
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
  el.innerHTML = items.map((item, i) => {
    const title = typeof item === 'string' ? `${label} ${i + 1}` : (item.title || `${label} ${i + 1}`);
    const detail = typeof item === 'string' ? item : (item.detail || item.note || '');
    const overlay = typeof item === 'object' ? (item.overlayText || '') : '';
    const overlayHtml = overlay ? `<div class="overlay-chip"><span>Overlay:</span> ${escapeHtml(overlay)}</div>` : '';
    return `<div class="sequence-item"><div class="sequence-index">${i + 1}</div><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p>${overlayHtml}</div></div>`;
  }).join('');
}

function activateTab(name) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === name);
  });
  document.querySelectorAll('.result-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.panel !== name);
  });
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
  els.selectedPhoto.innerHTML = state.photos.map((photo, index) =>
    `<option value="${index}">Photo ${index + 1}${photo.name ? ` — ${escapeHtml(photo.name)}` : ''}</option>`
  ).join('');
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
  const match = lead.match(/photo\s*(\d+)/i);
  if (match) {
    const index = Math.max(0, Number(match[1]) - 1);
    if (state.photos[index]) return index;
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
  } else if (mode === 'basic') {
    sx = img.width * 0.07;
    sy = img.height * 0.07;
    sw = img.width * 0.86;
    sh = img.height * 0.86;
  }

  const outputWidth = targetAspect ? 1200 : Math.max(1, Math.round(sw));
  const outputHeight = targetAspect ? Math.round(outputWidth / targetAspect) : Math.max(1, Math.round(sh));
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  ctx.filter = mode === 'basic'
    ? 'brightness(1.10) contrast(1.10) saturate(1.07) sepia(0.025)'
    : 'brightness(1.05) contrast(1.06) saturate(1.04) sepia(0.02)';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL('image/jpeg', 0.92);
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

  const overlayGradient = ctx.createLinearGradient(0, canvas.height * 0.42, 0, canvas.height);
  overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
  overlayGradient.addColorStop(0.55, 'rgba(0,0,0,0.24)');
  overlayGradient.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brand = getProfile().businessName || 'Ocean State Spice & Tea Merchants';
  const location = getProfile().businessLocation || '';
  const text = state.result?.postOverlayText || state.result?.headline || 'New in the shop';
  const subText = location ? `${brand} • ${location}` : brand;

  const left = 70;
  const maxWidth = canvas.width - left * 2;
  let fontSize = 82;
  let lines = [];
  do {
    ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    fontSize -= 4;
  } while ((lines.length > 4 || lines.some((line) => ctx.measureText(line).width > maxWidth)) && fontSize > 44);

  const lineHeight = Math.round(fontSize * 1.05);
  const textBlockHeight = lines.length * lineHeight;
  const subFontSize = 28;
  const footerGap = 26;
  let y = canvas.height - 90 - subFontSize - footerGap - textBlockHeight;

  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, left, y + (index * lineHeight));
  });

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `600 ${subFontSize}px Inter, Arial, sans-serif`;
  ctx.fillText(subText, left, canvas.height - 96);

  return canvas.toDataURL('image/jpeg', 0.94);
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
  if (!state.authReady) {
    showToast('Connecting to Firebase…');
    return;
  }
  if (!state.user) {
    showAuthNotice('Sign in with Google first, then try AI Clean Up.');
    await signIn();
    return;
  }

  setActivePhotoButton(sourceButton, true, 'AI editing…');
  try {
    const response = await editSocialPhoto({
      image: photo.dataUrl,
      editType: 'cleanup',
      noteText: selectedPhotoNoteText(),
    });
    const data = response?.data || {};
    if (!data.imageDataUrl) throw new Error('No edited photo was returned.');
    showEditedPreview(data.imageDataUrl, 'AI recommended edit', 'AI used the photo-analysis notes above to make image-aware cleanup/composition improvements. Compare it with the original carefully, especially product labels and packaging.');
  } catch (error) {
    console.error(error);
    const code = String(error?.code || '');
    if (code.includes('resource-exhausted')) {
      showAuthNotice('Photo editing is temporarily rate limited. Try again shortly.');
    } else if (code.includes('invalid-argument')) {
      showAuthNotice(error?.message || 'That photo could not be edited. Try another image.');
    } else if (code.includes('unauthenticated')) {
      showAuthNotice('Your sign-in expired. Sign in again and retry.');
    } else {
      showAuthNotice(error?.message || 'AI photo editing is temporarily unavailable.');
    }
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

function currentProjectSnapshot() {
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
    photos: state.photos,
    result: state.result,
  };
}

function saveCurrentProject() {
  if (!state.result) return;
  const snapshot = currentProjectSnapshot();
  const deduped = state.recentProjects.filter((item) =>
    !(item.headline === snapshot.headline && item.description === snapshot.description));
  state.recentProjects = [snapshot, ...deduped].slice(0, MAX_RECENT_PROJECTS);
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(state.recentProjects));
  renderRecentProjects();
}

function loadRecentProjects() {
  try {
    state.recentProjects = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]');
    if (!Array.isArray(state.recentProjects)) state.recentProjects = [];
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
  els.recentProjectsList.innerHTML = list.map((project) => `
    <button class="recent-project" type="button" data-project-id="${project.id}">
      <div class="recent-project-title">${escapeHtml(project.headline || 'Untitled project')}</div>
      <div class="recent-project-meta">${escapeHtml(formatDateTime(project.createdAt))} • ${project.photos?.length || 0} photo${(project.photos?.length || 0) === 1 ? '' : 's'}</div>
    </button>
  `).join('');

  els.recentProjectsList.querySelectorAll('[data-project-id]').forEach((btn) => {
    btn.addEventListener('click', () => loadProject(btn.dataset.projectId));
  });
}

function applyProject(project) {
  if (!project) return;
  state.photos = Array.isArray(project.photos) ? project.photos : [];
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
  renderRecentProjects();
  showToast('Recent projects cleared');
});

loadProfile();
loadRecentProjects();
updateReelModeVisibility();
refreshSelectedPhotoOptions();
initFirebase();
