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
    profile = {
      ...defaultProfile,
      ...JSON.parse(localStorage.getItem('socialStudioProfile') || '{}')
    };
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
        const maxSide = 1200;
        let {width, height} = img;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', .78));
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
      renderPhotos();
    });
  });
}

function setLoading(isLoading, label = 'Create Social Package') {
  state.isLoading = isLoading;
  els.generateBtn.disabled = isLoading;
  els.refineBtns.forEach((btn) => { btn.disabled = isLoading; });
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

  const loadingLabel = action === 'generate' ?
    'Creating your social package…' :
    'Refining your package…';

  setLoading(true, loadingLabel);
  try {
    const response = await generateSocialPackage(buildPayload(action, refineInstruction));
    const data = response?.data || {};
    if (!data.result) throw new Error('No social package was returned.');
    state.result = data.result;
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
  document.getElementById('reelHookOutput').textContent = safeText(result.reelHook);
  document.getElementById('overlayOutput').textContent = safeText(result.overlayText);
  document.getElementById('storyOutput').textContent = safeText(result.story);
  document.getElementById('ctaOutput').textContent = safeText(result.cta);
  document.getElementById('leadImageOutput').textContent = safeText(result.leadImage);
  renderSequence('reelPlanOutput', result.reelPlan, 'SHOT');
  renderSequence('visualNotesOutput', result.visualNotes, 'PHOTO');
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
    return `<div class="sequence-item"><div class="sequence-index">${i + 1}</div><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div></div>`;
  }).join('');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
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
  reelHook: 'reelHook',
  overlayText: 'overlayText',
  story: 'story',
  cta: 'cta'
};

document.querySelectorAll('.copy-btn').forEach((btn) => {
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
  els.resultsState.classList.add('hidden');
  els.emptyState.classList.remove('hidden');
  els.description.focus();
  window.scrollTo({top: 0, behavior: 'smooth'});
});

loadProfile();
updateReelModeVisibility();
initFirebase();
