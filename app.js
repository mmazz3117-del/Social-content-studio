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
  editedPreviewCard: document.getElementById('editedPreviewCard'),
  editedPreviewTitle: document.getElementById('editedPreviewTitle'),
  originalPreview: document.getElementById('originalPreview'),
  editedPreview: document.getElementById('editedPreview'),
  downloadEditedBtn: document.getElementById('downloadEditedBtn'),
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

function setLoading(isLoading, label = 'Create Social Package') {
  state.isLoading = isLoading;
  els.generateBtn.disabled = isLoading;
  els.refineBtns.forEach((btn) => { btn.disabled = isLoading; });
  els.basicEditBtn.disabled = isLoading;
  els.aiCleanupBtn.disabled = isLoading;
  els.format45Btn.disabled = isLoading;
  els.format916Btn.disabled = isLoading;
  els.downloadEditedBtn.disabled = isLoading || !state.editedPhotoDataUrl;
  els.generateLabel.textContent = isLoading ? label : 'Create Social Package';
}

function buildPayload(action = 'generate', refineInstruction = '') {
  return {
    action,
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

async function runPackageRequest(action = 'generate', refineInstruction = '') {
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

  const loadingLabel = action === 'generate' ? 'Creating your social package…' : 'Refining your package…';

  setLoading(true, loadingLabel);
  try {
    const response = await generateSocialPackage(buildPayload(action, refineInstruction));
    const data = response?.data || {};
    if (!data.result) throw new Error('No social package was returned.');
    state.result = data.result;
    clearEditedPreview();
    renderResult(data.result);
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
    setLoading(false);
  }
}

els.generateBtn.addEventListener('click', () => runPackageRequest('generate'));

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

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (c) => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[c]));
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

function clearEditedPreview() {
  state.editedPhotoDataUrl = '';
  state.editedPhotoLabel = '';
  els.editedPreviewCard.classList.add('hidden');
  els.originalPreview.removeAttribute('src');
  els.editedPreview.removeAttribute('src');
  els.downloadEditedBtn.disabled = true;
}

function showEditedPreview(editedDataUrl, label) {
  const photo = getSelectedPhoto();
  if (!photo) return;
  state.editedPhotoDataUrl = editedDataUrl;
  state.editedPhotoLabel = label;
  els.editedPreviewTitle.textContent = label;
  els.originalPreview.src = photo.dataUrl;
  els.editedPreview.src = editedDataUrl;
  els.editedPreviewCard.classList.remove('hidden');
  els.downloadEditedBtn.disabled = false;
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
      sy = (img.height - sh) * 0.38;
    }
  } else if (mode === 'basic') {
    sx = img.width * 0.04;
    sy = img.height * 0.04;
    sw = img.width * 0.92;
    sh = img.height * 0.92;
  }

  const outputWidth = targetAspect ? 1200 : Math.max(1, Math.round(sw));
  const outputHeight = targetAspect ? Math.round(outputWidth / targetAspect) : Math.max(1, Math.round(sh));
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  ctx.filter = mode === 'basic'
    ? 'brightness(1.06) contrast(1.08) saturate(1.05) sepia(0.03)'
    : 'brightness(1.05) contrast(1.06) saturate(1.04) sepia(0.02)';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL('image/jpeg', 0.92);
}

async function runLocalPhotoTool(tool) {
  const photo = getSelectedPhoto();
  if (!photo) {
    showToast('Choose a photo first');
    return;
  }

  let label = 'Adjusted photo';
  let options = {mode: 'basic'};
  if (tool === 'basic') {
    label = 'Basic edited photo';
    options = {mode: 'basic'};
  } else if (tool === '4x5') {
    label = '4:5 post version';
    options = {mode: 'format', targetAspect: 4 / 5};
  } else if (tool === '9x16') {
    label = '9:16 story/reel version';
    options = {mode: 'format', targetAspect: 9 / 16};
  }

  setLoading(true, 'Preparing edited photo…');
  try {
    const edited = await createLocalEditedPhoto(photo.dataUrl, options);
    showEditedPreview(edited, label);
  } catch (error) {
    console.error(error);
    showAuthNotice('That photo could not be processed in the browser.');
  } finally {
    setLoading(false);
  }
}

async function runAiCleanup() {
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

  setLoading(true, 'Creating AI cleanup…');
  try {
    const response = await editSocialPhoto({
      image: photo.dataUrl,
      editType: 'cleanup',
      noteText: selectedPhotoNoteText(),
    });
    const data = response?.data || {};
    if (!data.imageDataUrl) throw new Error('No edited photo was returned.');
    showEditedPreview(data.imageDataUrl, 'AI cleanup photo');
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
    setLoading(false);
  }
}

els.basicEditBtn.addEventListener('click', () => runLocalPhotoTool('basic'));
els.format45Btn.addEventListener('click', () => runLocalPhotoTool('4x5'));
els.format916Btn.addEventListener('click', () => runLocalPhotoTool('9x16'));
els.aiCleanupBtn.addEventListener('click', runAiCleanup);

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

loadProfile();
updateReelModeVisibility();
refreshSelectedPhotoOptions();
initFirebase();
