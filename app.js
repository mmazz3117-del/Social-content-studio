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
const MAX_IMAGES = 10;
const MAX_VIDEOS = 4;
const VIDEO_FRAME_COUNT = 3;
const MAX_TOTAL_IMAGE_CHARS = 12_000_000;
const PROJECTS_STORAGE_KEY = 'socialStudioRecentProjectsV17';
const MAX_RECENT_PROJECTS = 8;
const MEDIA_DB_NAME = 'socialStudioMediaV1';
const MEDIA_DB_STORE = 'videos';
const MIC_MODE_STORAGE_KEY = 'socialMediaPalMicModeV1';

const REFINE_INSTRUCTIONS = {
  shorter: 'Create a clearly shorter version, not a light edit. Reduce the primary caption and Story copy by roughly 35–50% while preserving the important facts. Use tighter sentences and remove repetition.',
  more_fun: 'Create a noticeably different, more playful version of the entire package. Change the opening hook, sentence rhythm, caption wording, Story wording, and suggested overlays while keeping every factual detail accurate. Add warmth, personality and energy without sounding cheesy, childish, or overhyped. Do not simply paraphrase the current result.',
  less_salesy: 'Rewrite the package so it feels clearly more conversational and editorial, like a friendly local recommendation rather than an advertisement. Remove pushy sales language, vary the hook, and keep the same facts.',
  try_another: 'Create a genuinely different creative concept for the whole package, not a paraphrase. Choose a new angle, new hook, new caption structure, new Story wording, and different overlay suggestions while preserving the facts.'
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
  videoSources: [],
  activeView: 'create',
  readyAssets: {feed: '', story: '', storyVideoBlob: null, storyMime: '', reelSlides: [], reelBlob: null, reelMime: '', packageBlob: null},
  reelPreviewTimer: null,
  reelPreviewIndex: 0,
  assetStyleIndex: 0,
  activeAssetTab: 'feed',
  approvedAssets: {feed: false, story: false, reel: false},
  activeProjectId: null,
  mediaSession: 0,
  mediaBusy: false,
  voiceListening: false,
  lastWorkingMicMode: '',
  reelEditPrefs: {clipScale: 1, transitionMs: 320, preferVideoBoost: false, variant: 0, sourceScales: {}, feedback: ''},
};

const els = {
  photoInput: document.getElementById('photoInput'),
  videoInput: document.getElementById('videoInput'),
  dropZone: document.getElementById('dropZone'),
  photoGrid: document.getElementById('photoGrid'),
  mediaSummary: document.getElementById('mediaSummary'),
  description: document.getElementById('description'),
  tellPalBtn: document.getElementById('tellPalBtn'),
  voiceStatus: document.getElementById('voiceStatus'),
  micMode: document.getElementById('micMode'),
  testMicBtn: document.getElementById('testMicBtn'),
  micLevelBar: document.getElementById('micLevelBar'),
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
  deleteCurrentBtn: document.getElementById('deleteCurrentBtn'),
  toast: document.getElementById('toast'),
  refineBtns: [...document.querySelectorAll('.refine-btn')],
  workerAssets: document.getElementById('workerAssets'),
  feedAssetPreview: document.getElementById('feedAssetPreview'),
  storyAssetPreview: document.getElementById('storyAssetPreview'),
  storyAssetPreviewVideo: document.getElementById('storyAssetPreviewVideo'),
  storyVideoOverlay: document.getElementById('storyVideoOverlay'),
  storyVideoOverlayTitle: document.getElementById('storyVideoOverlayTitle'),
  storyVideoOverlayCta: document.getElementById('storyVideoOverlayCta'),
  storyAssetTitle: document.getElementById('storyAssetTitle'),
  storyReadyBadge: document.getElementById('storyReadyBadge'),
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
  reelSceneSummary: document.getElementById('reelSceneSummary'),
  reelAdjustBtns: [...document.querySelectorAll('.reel-adjust-btn')],
  reelFeedbackText: document.getElementById('reelFeedbackText'),
  applyReelFeedbackBtn: document.getElementById('applyReelFeedbackBtn'),
  reelFeedbackStatus: document.getElementById('reelFeedbackStatus'),
  assetStatus: document.getElementById('assetStatus'),
  assetTabs: [...document.querySelectorAll('.asset-tab')],
  assetPanels: [...document.querySelectorAll('.asset-panel')],
  approveBtns: [...document.querySelectorAll('.approve-btn')],
  approvalCount: document.getElementById('approvalCount'),
  palPick: document.getElementById('palPick'),
  nextAssetBtns: [...document.querySelectorAll('.next-asset-btn')],
  briefStarterBtns: [...document.querySelectorAll('[data-brief-starter]')],
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
let speechRecognition = null;
let voiceBaseText = '';
let voiceTranscript = '';
let micTestStream = null;
let micAudioContext = null;


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

function allVideoSources() {
  if (Array.isArray(state.videoSources) && state.videoSources.length) return state.videoSources;
  return state.videoSource ? [state.videoSource] : [];
}

function primaryVideoSource() {
  return allVideoSources()[0] || null;
}

function syncPrimaryVideoSource() {
  state.videoSource = primaryVideoSource();
}

function releaseCurrentVideoUrl() {
  allVideoSources().forEach((source) => {
    if (source?.objectUrl) {
      try { URL.revokeObjectURL(source.objectUrl); } catch {}
    }
  });
  if (els.reelPreviewVideo) {
    try { els.reelPreviewVideo.pause(); } catch {}
    els.reelPreviewVideo.removeAttribute('src');
    els.reelPreviewVideo.load?.();
  }
  if (els.storyAssetPreviewVideo) {
    try { els.storyAssetPreviewVideo.pause(); } catch {}
    els.storyAssetPreviewVideo.removeAttribute('src');
    els.storyAssetPreviewVideo.load?.();
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
    clipIndex: Number(source.clipIndex || 0),
  };
}

function serializableVideoSources(sources = allVideoSources()) {
  return (sources || []).map((source) => serializableVideoSource(source)).filter(Boolean);
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

async function hydrateVideoSources(sources = []) {
  const hydrated = [];
  for (const source of (sources || [])) {
    const item = await hydrateVideoSource(source);
    if (item) hydrated.push(item);
  }
  return hydrated;
}

function videoSourceById(id) {
  return allVideoSources().find((source) => source.id === id) || null;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function setVoiceStatus(message, stateName = '') {
  if (!els.voiceStatus) return;
  els.voiceStatus.textContent = message;
  if (stateName) els.voiceStatus.dataset.state = stateName;
  else delete els.voiceStatus.dataset.state;
}

function setMicMeter(level = 0) {
  if (!els.micLevelBar) return;
  els.micLevelBar.style.width = `${Math.round(clamp(Number(level || 0), 0, 1) * 100)}%`;
}

function micCandidates(mode = 'auto') {
  if (mode === 'mono' || mode === 'stereo') return [mode];
  const preferred = state.lastWorkingMicMode && state.lastWorkingMicMode !== 'auto' ? [state.lastWorkingMicMode] : [];
  return [...new Set([...preferred, 'default', 'mono', 'stereo'])];
}

function micConstraints(candidate = 'default') {
  const supported = navigator.mediaDevices?.getSupportedConstraints?.() || {};
  const audio = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  if (supported.channelCount && candidate === 'mono') audio.channelCount = {ideal: 1};
  if (supported.channelCount && candidate === 'stereo') audio.channelCount = {ideal: 2};
  return {audio, video: false};
}

function stopMicTestStream() {
  if (micTestStream) micTestStream.getTracks().forEach((track) => track.stop());
  micTestStream = null;
  if (micAudioContext) {
    try { micAudioContext.close(); } catch {}
  }
  micAudioContext = null;
  setMicMeter(0);
}

async function openMicCandidate(candidate) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access is not supported in this browser.');
  return navigator.mediaDevices.getUserMedia(micConstraints(candidate));
}

function micChannelDescription(stream, requestedMode = '') {
  const settings = stream?.getAudioTracks?.()[0]?.getSettings?.() || {};
  const channelCount = Number(settings.channelCount || 0);
  if (channelCount) return `${channelCount} channel${channelCount === 1 ? '' : 's'}`;
  if (requestedMode === 'mono') return 'mono requested';
  if (requestedMode === 'stereo') return 'stereo requested';
  return 'device default';
}

async function measureMicSignal(stream, durationMs = 1900) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return {peak: 0.02, measured: false};
  micAudioContext = new AudioContextCtor();
  try { await micAudioContext.resume(); } catch {}
  const analyser = micAudioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.55;
  const source = micAudioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let peak = 0;
  const started = performance.now();
  await new Promise((resolve) => {
    const sample = (now) => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
      const rms = Math.sqrt(sum / samples.length);
      peak = Math.max(peak, rms);
      setMicMeter(Math.min(1, rms * 9));
      if (now - started < durationMs) requestAnimationFrame(sample);
      else resolve();
    };
    requestAnimationFrame(sample);
  });
  try { source.disconnect(); } catch {}
  return {peak, measured: true};
}

async function testMicrophone() {
  if (!els.testMicBtn) return;
  if (state.voiceListening && speechRecognition) {
    try { speechRecognition.stop(); } catch {}
  }
  stopMicTestStream();
  els.testMicBtn.disabled = true;
  els.testMicBtn.textContent = 'Testing…';
  setVoiceStatus('Speak normally for a couple of seconds…', 'listening');
  const selected = els.micMode?.value || 'auto';
  let openedWithoutSignal = null;
  try {
    for (const candidate of micCandidates(selected)) {
      let stream = null;
      try {
        stream = await openMicCandidate(candidate);
        micTestStream = stream;
        const signal = await measureMicSignal(stream);
        const channelText = micChannelDescription(stream, candidate);
        if (!signal.measured || signal.peak > 0.006) {
          state.lastWorkingMicMode = candidate;
          setVoiceStatus(`Microphone working • ${candidate === 'default' ? 'Auto/default' : candidate[0].toUpperCase() + candidate.slice(1)} • ${channelText}`, 'success');
          showToast('Microphone test passed');
          return;
        }
        openedWithoutSignal = {candidate, channelText};
      } catch (error) {
        console.info(`Mic test failed for ${candidate}`, error);
      } finally {
        if (stream) stream.getTracks().forEach((track) => track.stop());
        micTestStream = null;
        if (micAudioContext) {
          try { await micAudioContext.close(); } catch {}
          micAudioContext = null;
        }
        setMicMeter(0);
      }
    }
    if (openedWithoutSignal) {
      setVoiceStatus(`The microphone opened (${openedWithoutSignal.channelText}) but I did not detect your voice. Try the other Mono/Stereo setting and test again.`, 'warning');
    } else {
      setVoiceStatus('I could not open the microphone. Check Safari/site microphone permission, then try Mono or Stereo.', 'error');
    }
  } finally {
    stopMicTestStream();
    els.testMicBtn.disabled = false;
    els.testMicBtn.textContent = 'Test microphone';
  }
}

async function prepareMicrophoneForSpeech() {
  const selected = els.micMode?.value || 'auto';
  let lastError = null;
  for (const candidate of micCandidates(selected)) {
    let stream = null;
    try {
      stream = await openMicCandidate(candidate);
      state.lastWorkingMicMode = candidate;
      const description = micChannelDescription(stream, candidate);
      stream.getTracks().forEach((track) => track.stop());
      return {candidate, description};
    } catch (error) {
      lastError = error;
      if (stream) stream.getTracks().forEach((track) => track.stop());
    }
  }
  throw lastError || new Error('Microphone could not be opened.');
}

function speechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function updateTellPalButton(isListening) {
  if (!els.tellPalBtn) return;
  els.tellPalBtn.classList.toggle('listening', Boolean(isListening));
  els.tellPalBtn.innerHTML = isListening
    ? '<span class="tell-pal-icon">■</span><span><strong>Stop listening</strong><small>Tap when you are finished</small></span>'
    : '<span class="tell-pal-icon">🎙️</span><span><strong>Tell Pal</strong><small>Speak your idea instead of typing</small></span>';
}

function stopTellPal() {
  if (!speechRecognition) return;
  try { speechRecognition.stop(); } catch {}
}

async function startTellPal() {
  if (state.voiceListening) {
    stopTellPal();
    return;
  }
  const RecognitionCtor = speechRecognitionConstructor();
  if (!RecognitionCtor) {
    setVoiceStatus('Speech-to-text is not available in this browser. You can still use the iPhone keyboard microphone.', 'warning');
    return;
  }

  setVoiceStatus('Checking microphone…', 'working');
  try {
    const mic = await prepareMicrophoneForSpeech();
    setVoiceStatus(`Mic ready • ${mic.description}. Start speaking…`, 'listening');
  } catch (error) {
    console.error('Tell Pal microphone preparation failed', error);
    const denied = String(error?.name || '').toLowerCase().includes('notallowed');
    setVoiceStatus(denied ? 'Microphone permission is blocked. Allow microphone access for this site, then try again.' : 'Microphone could not open. Try Mic Settings → Mono or Stereo, then Test microphone.', 'error');
    return;
  }

  const recognition = new RecognitionCtor();
  speechRecognition = recognition;
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  voiceBaseText = els.description?.value.trim() || '';
  voiceTranscript = '';

  recognition.onstart = () => {
    state.voiceListening = true;
    updateTellPalButton(true);
    setVoiceStatus('Listening… tell Pal what you want to create.', 'listening');
  };
  recognition.onresult = (event) => {
    let heard = '';
    for (let i = 0; i < event.results.length; i += 1) {
      heard += `${event.results[i][0]?.transcript || ''} `;
    }
    voiceTranscript = heard.trim();
    const combined = [voiceBaseText, voiceTranscript].filter(Boolean).join(voiceBaseText && voiceTranscript ? ' ' : '');
    if (els.description) els.description.value = combined;
    setVoiceStatus(voiceTranscript ? 'Listening… I’m hearing you.' : 'Listening… start speaking.', 'listening');
  };
  recognition.onerror = (event) => {
    console.info('Tell Pal speech recognition error', event?.error);
    const messages = {
      'not-allowed': 'Microphone permission was denied. Allow microphone access and try again.',
      'audio-capture': 'No usable microphone audio was found. Try Mic Settings → Mono or Stereo.',
      'no-speech': 'I did not hear speech. Tap Tell Pal and try again.',
      'network': 'Speech recognition could not connect. Check your connection and try again.',
    };
    setVoiceStatus(messages[event?.error] || 'Tell Pal stopped listening. Try again or test the microphone.', 'warning');
  };
  recognition.onend = () => {
    state.voiceListening = false;
    updateTellPalButton(false);
    speechRecognition = null;
    if (voiceTranscript) {
      setVoiceStatus('Added to your project brief. You can edit it or tap Make It For Me.', 'success');
      showToast('Voice brief added');
    } else if (els.voiceStatus?.dataset.state === 'listening') {
      setVoiceStatus('Ready when you are.');
    }
  };

  try {
    recognition.start();
  } catch (error) {
    console.error(error);
    state.voiceListening = false;
    updateTellPalButton(false);
    speechRecognition = null;
    setVoiceStatus('Tell Pal could not start. Test the microphone and try again.', 'error');
  }
}

function loadMicPreference() {
  const saved = localStorage.getItem(MIC_MODE_STORAGE_KEY);
  if (els.micMode && ['auto', 'mono', 'stereo'].includes(saved || '')) els.micMode.value = saved;
}

els.tellPalBtn?.addEventListener('click', startTellPal);
els.testMicBtn?.addEventListener('click', testMicrophone);
els.micMode?.addEventListener('change', () => {
  localStorage.setItem(MIC_MODE_STORAGE_KEY, els.micMode.value);
  state.lastWorkingMicMode = '';
  setVoiceStatus(`${els.micMode.options[els.micMode.selectedIndex]?.text || 'Microphone mode'} selected. Test it if you are having trouble.`);
});

function showAuthNotice(message) {
  els.authNotice.textContent = message;
  els.authNotice.classList.remove('hidden');
  clearTimeout(showAuthNotice.timer);
  showAuthNotice.timer = setTimeout(() => els.authNotice.classList.add('hidden'), 6500);
}

function clearAuthNotice() {
  clearTimeout(showAuthNotice.timer);
  els.authNotice.textContent = '';
  els.authNotice.classList.add('hidden');
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
els.briefStarterBtns?.forEach((button) => button.addEventListener('click', () => {
  els.description.value = button.dataset.briefStarter || '';
  els.description.focus();
  showToast('Direction added — edit it or tap Make It For Me');
}));
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

function setMediaBusy(isBusy) {
  state.mediaBusy = Boolean(isBusy);
  if (!state.isLoading) {
    els.generateBtn.disabled = state.mediaBusy;
    els.oneTapBtn.disabled = state.mediaBusy;
  }
}

async function addFiles(files) {
  const mediaSession = state.mediaSession;
  const images = files.filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type));
  const videos = files.filter((file) => String(file.type || '').startsWith('video/'));

  const currentVideos = allVideoSources();
  const baseVideoCount = currentVideos.length;
  if (videos.length && !currentVideos.length && state.photos.some((photo) => photo.sourceType === 'videoFrame')) {
    state.photos = state.photos.filter((photo) => photo.sourceType !== 'videoFrame');
  }
  const remainingVideoSlots = Math.max(0, MAX_VIDEOS - currentVideos.length);
  if (videos.length > remainingVideoSlots) showToast(`Up to ${MAX_VIDEOS} videos per project`);

  const slots = () => Math.max(0, MAX_IMAGES - state.photos.length);

  for (const file of images) {
    if (!slots()) break;
    try {
      const optimized = await optimizeImage(file);
      if (mediaSession !== state.mediaSession) return;
      state.photos.push({name: file.name, dataUrl: optimized, sourceType: 'photo'});
    } catch {
      showToast(`Could not read ${file.name}`);
    }
  }

  const videosToAdd = videos.slice(0, remainingVideoSlots);
  if (videosToAdd.length && !slots()) showToast(`Maximum of ${MAX_IMAGES} media items`);

  if (videosToAdd.length && slots()) {
    setMediaBusy(true);
    let addedVideoCount = 0;
    try {
      for (let i = 0; i < videosToAdd.length; i += 1) {
        if (!slots()) break;
        const file = videosToAdd[i];
        const frameTarget = Math.min(slots(), videosToAdd.length === 1 ? VIDEO_FRAME_COUNT : 2);
        if (!frameTarget) break;
        showToast(`Preparing video ${addedVideoCount + 1} of ${videosToAdd.length}…`);
        const extracted = await extractVideoFrames(file, frameTarget);
        if (mediaSession !== state.mediaSession) return;
        const videoId = makeId('video');
        extracted.frames.forEach((frame, index) => {
          state.photos.push({
            name: `${file.name} — frame ${index + 1}`,
            dataUrl: frame.dataUrl,
            sourceType: 'videoFrame',
            videoName: file.name,
            videoTime: frame.time,
            videoId,
          });
        });
        const persisted = await saveVideoBlobToDb(videoId, file);
        if (mediaSession !== state.mediaSession) {
          if (persisted) await deleteVideoBlobFromDb(videoId);
          return;
        }
        const source = {
          id: videoId,
          name: file.name,
          duration: extracted.duration,
          frameCount: extracted.frames.length,
          type: file.type || 'video/mp4',
          size: file.size || 0,
          clipIndex: baseVideoCount + addedVideoCount + 1,
          blob: file,
          objectUrl: URL.createObjectURL(file),
          persisted,
        };
        state.videoSources.push(source);
        addedVideoCount += 1;
      }
      syncPrimaryVideoSource();
      clearAuthNotice();
      const zeroFrameVideos = state.videoSources.slice(-addedVideoCount).filter((source) => !source.frameCount).length;
      if (zeroFrameVideos) showToast(`Video kept — ${zeroFrameVideos} clip${zeroFrameVideos === 1 ? '' : 's'} had limited frame analysis`);
      else if (addedVideoCount) showToast(`${addedVideoCount} video${addedVideoCount === 1 ? '' : 's'} ready for editing`);
    } catch (error) {
      console.error(error);
      if (mediaSession === state.mediaSession) showAuthNotice('One of the videos could not be sampled. Try a different MP4 or MOV clip.');
    } finally {
      if (mediaSession === state.mediaSession) setMediaBusy(false);
    }
  }

  if (!images.length && !videos.length) showToast('Choose a photo or video file');
  if (!slots() && images.length + videos.length > 0) showToast(`Maximum of ${MAX_IMAGES} media items`);

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

function waitUntil(predicate, timeoutMs = 12000, intervalMs = 60) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const tick = () => {
      try {
        if (predicate()) return resolve();
      } catch {}
      if (performance.now() - started >= timeoutMs) return reject(new Error('Timed out waiting for video decode.'));
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

async function ensureVideoFrameDecoded(video) {
  if (typeof video.requestVideoFrameCallback === 'function') {
    await Promise.race([
      new Promise((resolve) => video.requestVideoFrameCallback(() => resolve())),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
    return;
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function seekVideoRobust(video, target) {
  const duration = Number(video.duration || 0);
  const safeTarget = Math.max(0, Math.min(Number(target || 0), Math.max(0, duration - 0.04)));
  if (Math.abs(Number(video.currentTime || 0) - safeTarget) > 0.03) {
    try { video.currentTime = safeTarget; } catch {}
  }
  try {
    await waitUntil(() => video.readyState >= 2 && Math.abs(Number(video.currentTime || 0) - safeTarget) < 0.45, 9000, 50);
  } catch {
    // iOS occasionally stalls on a blob seek until the video decoder is briefly started.
    try {
      video.muted = true;
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 140));
      video.pause();
      video.currentTime = safeTarget;
      await waitUntil(() => video.readyState >= 2 && Math.abs(Number(video.currentTime || 0) - safeTarget) < 0.55, 7000, 60);
    } catch (error) {
      throw error;
    }
  }
  await ensureVideoFrameDecoded(video);
}

function captureVideoCanvasFrame(video, maxSide = 1400) {
  const sourceWidth = Number(video.videoWidth || 0);
  const sourceHeight = Number(video.videoHeight || 0);
  if (!sourceWidth || !sourceHeight) throw new Error('Video dimensions are not available yet.');
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .84);
}

async function extractVideoFrames(file, frameCount = VIDEO_FRAME_COUNT) {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.preload = 'auto';
  video.style.position = 'fixed';
  video.style.left = '-9999px';
  video.style.top = '0';
  video.style.width = '2px';
  video.style.height = '2px';
  video.style.opacity = '0.01';
  video.style.pointerEvents = 'none';
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  document.body.appendChild(video);
  try {
    try { video.load(); } catch {}
    if (video.readyState < 1) await waitForMediaEvent(video, 'loadedmetadata');
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const safeCount = Math.max(1, Math.min(VIDEO_FRAME_COUNT, Number(frameCount) || 1));
    const positions = safeCount === 1
      ? [0.38]
      : Array.from({length: safeCount}, (_, i) => 0.12 + ((0.76 * i) / (safeCount - 1)));
    const frames = [];

    for (const ratio of positions) {
      const target = Math.min(Math.max(0, duration * ratio), Math.max(0, duration - 0.05));
      try {
        await seekVideoRobust(video, target);
        frames.push({time: target, dataUrl: captureVideoCanvasFrame(video)});
      } catch (error) {
        console.info(`Could not sample video at ${target.toFixed(2)}s`, error);
      }
    }

    // If normal seeking was troublesome, make one last attempt near the beginning.
    if (!frames.length) {
      const target = Math.min(Math.max(0.03, duration * 0.08), Math.max(0, duration - 0.05));
      try {
        await seekVideoRobust(video, target);
        frames.push({time: target, dataUrl: captureVideoCanvasFrame(video)});
      } catch (error) {
        console.info('Fallback video frame capture failed', error);
      }
    }
    return {duration, frames};
  } finally {
    try { video.pause(); } catch {}
    video.removeAttribute('src');
    try { video.load(); } catch {}
    video.remove();
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

function renderMediaSummary() {
  if (!els.mediaSummary) return;
  const photos = state.photos.filter((photo) => photo.sourceType !== 'videoFrame').length;
  const videos = allVideoSources().length;
  if (!photos && !videos) {
    els.mediaSummary.classList.add('hidden');
    els.mediaSummary.textContent = '';
    return;
  }
  const bits = [];
  if (photos) bits.push(`${photos} photo${photos === 1 ? '' : 's'}`);
  if (videos) bits.push(`${videos} video${videos === 1 ? '' : 's'}`);
  const frameCount = state.photos.filter((photo) => photo.sourceType === 'videoFrame').length;
  els.mediaSummary.innerHTML = `<span>✓ Media ready</span><strong>${bits.join(' • ')}</strong>${frameCount ? `<small>${frameCount} video snapshots are only for analysis</small>` : ''}`;
  els.mediaSummary.classList.remove('hidden');
}

function renderPhotos() {
  let photoNumber = 0;
  const frameCounts = new Map();
  const videoIndexes = new Map(allVideoSources().map((source, index) => [source.id, index + 1]));
  els.photoGrid.innerHTML = state.photos.map((photo, index) => {
    const isVideo = photo.sourceType === 'videoFrame';
    let badge = '';
    if (isVideo) {
      const current = (frameCounts.get(photo.videoId || photo.videoName || 'video') || 0) + 1;
      frameCounts.set(photo.videoId || photo.videoName || 'video', current);
      const videoNumber = videoIndexes.get(photo.videoId) || 1;
      badge = `VIDEO ${videoNumber} F${current}`;
    } else {
      photoNumber += 1;
      badge = `PHOTO ${photoNumber}`;
    }
    const time = isVideo && Number.isFinite(photo.videoTime) ? `<span class="video-time">${photo.videoTime.toFixed(1)}s</span>` : '';
    return `<div class="photo-item">
      <img src="${photo.dataUrl}" alt="${isVideo ? 'Video frame' : 'Photo'} ${index + 1}" />
      <span class="photo-badge">${badge}</span>${time}
      <button class="photo-remove" type="button" data-index="${index}" aria-label="Remove media ${index + 1}">×</button>
    </div>`;
  }).join('');

  els.photoGrid.querySelectorAll('.photo-remove').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const removed = state.photos.splice(Number(btn.dataset.index), 1)[0];
      if (removed?.sourceType === 'videoFrame' && removed.videoId && !state.photos.some((photo) => photo.videoId === removed.videoId)) {
        const source = videoSourceById(removed.videoId);
        state.videoSources = allVideoSources().filter((item) => item.id !== removed.videoId);
        syncPrimaryVideoSource();
        if (source?.objectUrl) {
          try { URL.revokeObjectURL(source.objectUrl); } catch {}
        }
        await deleteVideoBlobFromDb(removed.videoId);
      }
      if (!state.photos.some((photo) => photo.sourceType === 'videoFrame')) {
        releaseCurrentVideoUrl();
        state.videoSources = [];
        state.videoSource = null;
      }
      state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, Math.max(0, state.photos.length - 1));
      clearEditedPreview();
      renderPhotos();
      refreshSelectedPhotoOptions();
      renderToolsState();
    });
  });
  renderMediaSummary();
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
  if (allVideoSources().length >= MAX_VIDEOS) {
    showToast(`This project already has ${MAX_VIDEOS} videos`);
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

function setPackageLoading(isLoading, label = '🎛️ Use My Settings') {
  state.isLoading = isLoading;
  els.generateBtn.disabled = isLoading;
  els.oneTapBtn.disabled = isLoading;
  els.refineBtns.forEach((btn) => {
    btn.disabled = isLoading || !state.result;
    btn.classList.toggle('is-busy', isLoading);
  });
  els.generateLabel.textContent = isLoading ? label : '🎛️ Use My Settings';
  const oneTapBusy = isLoading && String(label).toLowerCase().includes('one-tap');
  if (els.oneTapBtn) els.oneTapBtn.innerHTML = oneTapBusy ? '<span>✨ Pal is building…</span>' : '<span>✨ Make It For Me</span><span aria-hidden="true">→</span>';
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
      videoName: photo.videoName || '',
      videoId: photo.videoId || '',
      videoTime: Number.isFinite(photo.videoTime) ? Number(photo.videoTime.toFixed(2)) : null,
    })),
    videoContext: primaryVideoSource() ? {
      ...serializableVideoSource(primaryVideoSource()),
      frameCount: videoFrames.filter((photo) => !photo.videoId || photo.videoId === primaryVideoSource()?.id).length,
      frameTimes: videoFrames.filter((photo) => !photo.videoId || photo.videoId === primaryVideoSource()?.id).map((photo) => Number(photo.videoTime || 0).toFixed(1)),
    } : null,
    videoContexts: serializableVideoSources().map((source) => ({
      ...serializableVideoSource(source),
      frameCount: videoFrames.filter((photo) => photo.videoId === source.id).length,
      frameTimes: videoFrames.filter((photo) => photo.videoId === source.id).map((photo) => Number(photo.videoTime || 0).toFixed(1)),
    })),
    currentResult: action === 'refine' ? state.result : undefined,
    refineInstruction: action === 'refine' ? refineInstruction : undefined,
  };
}

async function runPackageRequest(action = 'generate', refineInstruction = '', extras = {}) {
  const description = els.description.value.trim();
  if (state.mediaBusy) {
    showToast('Video is still being prepared — one moment');
    return null;
  }
  const totalChars = state.photos.reduce((sum, photo) => sum + photo.dataUrl.length, 0);

  if (action === 'generate' && !description && !state.photos.length && !allVideoSources().length) {
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
    return data.result;
  } catch (error) {
    console.error(error);
    const code = String(error?.code || '');
    if (code.includes('unauthenticated')) showAuthNotice('Your sign-in expired. Sign in again and retry.');
    else if (code.includes('resource-exhausted')) showAuthNotice('The social-content limit was reached. Try again a little later.');
    else if (code.includes('invalid-argument')) showAuthNotice(error?.message || 'Please check the information and media and try again.');
    else showAuthNotice(error?.message || 'The AI request could not be completed.');
    return null;
  } finally {
    setPackageLoading(false);
  }
}

function normalizedWords(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function textSimilarity(a, b) {
  const left = new Set(normalizedWords(a));
  const right = new Set(normalizedWords(b));
  if (!left.size && !right.size) return 1;
  const intersection = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size || 1;
  return intersection / union;
}

const REFINE_LABELS = {shorter: 'Shorter', more_fun: 'More Fun', less_salesy: 'Less Salesy', try_another: 'Try Another'};

els.generateBtn.addEventListener('click', () => runPackageRequest('generate'));
els.oneTapBtn.addEventListener('click', () => {
  setOneTapDefaults();
  if (!els.description.value.trim() && (state.photos.length || allVideoSources().length)) showToast('One-Tap will choose the strongest angle.');
  runPackageRequest('generate', '', {oneTap: true});
});
els.refineBtns.forEach((btn) => btn.addEventListener('click', async () => {
  const refineKey = btn.dataset.refine;
  const instruction = REFINE_INSTRUCTIONS[refineKey];
  if (!instruction || btn.disabled) return;
  if (refineKey === 'try_another' || refineKey === 'more_fun') state.assetStyleIndex = (state.assetStyleIndex + 1) % 3;
  const original = btn.textContent;
  const before = state.result ? structuredClone(state.result) : null;
  btn.textContent = 'Working…';
  try {
    let updated = await runPackageRequest('refine', instruction);
    if (updated && before && (refineKey === 'more_fun' || refineKey === 'try_another')) {
      const similarity = textSimilarity(before.caption, updated.caption);
      if (similarity > 0.78) {
        const stronger = `${instruction} IMPORTANT: The previous attempt stayed too close to the current version. Make the new caption and story unmistakably different in opening, sentence structure, pacing, and wording while keeping facts accurate. Use a fresh angle.`;
        updated = await runPackageRequest('refine', stronger);
      }
    }
    if (updated) showToast(`Updated — ${REFINE_LABELS[refineKey] || 'new'} version`);
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
  activateAssetTab(allVideoSources().length ? 'reel' : 'feed');
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
  state.mediaSession += 1; // invalidates any video sampling still finishing in the background
  if (state.voiceListening && speechRecognition) {
    try { speechRecognition.abort(); } catch {}
  }
  state.voiceListening = false;
  speechRecognition = null;
  voiceBaseText = '';
  voiceTranscript = '';
  stopMicTestStream();
  updateTellPalButton(false);
  setVoiceStatus('Ready when you are.');
  setMediaBusy(false);
  releaseCurrentVideoUrl();
  state.photos = [];
  state.result = null;
  state.videoSource = null;
  state.videoSources = [];
  state.activeProjectId = null;
  state.selectedPhotoIndex = 0;
  state.readyAssets = {feed: '', story: '', storyVideoBlob: null, storyMime: '', reelSlides: [], reelBlob: null, reelMime: '', packageBlob: null};
  state.approvedAssets = {feed: false, story: false, reel: false};
  state.assetStyleIndex = 0;
  state.reelEditPrefs = freshReelEditPrefs();
  activateAssetTab('feed');
  stopReelPreview();
  els.workerAssets?.classList.add('hidden');
  els.description.value = '';
  els.photoInput.value = '';
  els.videoInput.value = '';
  clearAuthNotice();
  clearEditedPreview();
  if (els.photoGrid) els.photoGrid.innerHTML = '';
  if (els.selectedPhoto) els.selectedPhoto.innerHTML = '';
  if (els.feedAssetPreview) els.feedAssetPreview.removeAttribute('src');
  if (els.storyAssetPreviewVideo) {
    try { els.storyAssetPreviewVideo.pause(); } catch {}
    els.storyAssetPreviewVideo.removeAttribute('src');
    els.storyAssetPreviewVideo.load?.();
    els.storyAssetPreviewVideo.classList.add('hidden');
  }
  if (els.storyAssetPreview) {
    els.storyAssetPreview.removeAttribute('src');
    els.storyAssetPreview.classList.remove('hidden');
  }
  if (els.reelPreviewImage) els.reelPreviewImage.removeAttribute('src');
  if (els.reelPreviewVideo) {
    try { els.reelPreviewVideo.pause(); } catch {}
    els.reelPreviewVideo.removeAttribute('src');
    els.reelPreviewVideo.load?.();
  }
  if (els.reelPreviewHook) els.reelPreviewHook.textContent = '';
  if (els.reelPreviewOverlay) els.reelPreviewOverlay.textContent = '';
  if (els.assetStatus) els.assetStatus.textContent = '';
  if (els.reelReadyBadge) els.reelReadyBadge.textContent = 'Ready';
  if (els.reelFeedbackText) els.reelFeedbackText.value = '';
  if (els.reelFeedbackStatus) els.reelFeedbackStatus.textContent = '';
  if (els.reelSceneSummary) els.reelSceneSummary.innerHTML = '';
  if (els.storyReadyBadge) els.storyReadyBadge.textContent = 'Ready';
  renderPhotos();
  refreshSelectedPhotoOptions();
  renderToolsState();
  els.resultsState.classList.add('hidden');
  els.emptyState.classList.remove('hidden');
  activateView('create');
  showToast('New project ready');
}
els.newBtn.addEventListener('click', resetForNewProject);
els.deleteCurrentBtn?.addEventListener('click', async () => {
  if (state.activeProjectId) {
    const project = state.recentProjects.find((item) => item.id === state.activeProjectId);
    const label = project?.headline || 'this project';
    if (!window.confirm(`Delete “${label}” from this browser and clear the workspace?`)) return;
    state.recentProjects = state.recentProjects.filter((item) => item.id !== state.activeProjectId);
    try { localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(state.recentProjects)); } catch {}
    const videoIds = [project?.videoSource?.id, ...((project?.videoSources || []).map((item) => item?.id))].filter(Boolean);
    for (const videoId of videoIds) {
      if (!state.recentProjects.some((item) => item.videoSource?.id === videoId || (item.videoSources || []).some((source) => source?.id === videoId))) await deleteVideoBlobFromDb(videoId);
    }
    renderRecentProjects();
    resetForNewProject();
    showToast('Current project deleted');
    return;
  }
  if (!state.photos.length && !state.result && !els.description.value.trim()) {
    showToast('There is no current project to delete');
    return;
  }
  if (!window.confirm('Clear the current unsaved workspace?')) return;
  resetForNewProject();
  showToast('Current workspace cleared');
});

function refreshSelectedPhotoOptions() {
  let photoNumber = 0;
  const frameCounts = new Map();
  const videoIndexes = new Map(allVideoSources().map((source, index) => [source.id, index + 1]));
  els.selectedPhoto.innerHTML = state.photos.map((photo, index) => {
    const isVideoFrame = photo.sourceType === 'videoFrame';
    let label;
    if (isVideoFrame) {
      const current = (frameCounts.get(photo.videoId || photo.videoName || 'video') || 0) + 1;
      frameCounts.set(photo.videoId || photo.videoName || 'video', current);
      const videoNumber = videoIndexes.get(photo.videoId) || 1;
      label = `Video ${videoNumber} frame ${current}${Number.isFinite(photo.videoTime) ? ` (${photo.videoTime.toFixed(1)}s)` : ''}`;
    } else {
      photoNumber += 1;
      label = `Photo ${photoNumber}`;
    }
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
  const hasMedia = state.photos.length > 0 || allVideoSources().length > 0;
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

function editingIntentFromDescription() {
  const text = String(els.description?.value || '').toLowerCase();
  const fast = /energetic|energy|quick|fast|punchy|upbeat|lively|exciting|fun|dynamic|quick cuts?|snappy/.test(text);
  const slow = /elegant|calm|relaxed|refined|luxur|soothing|gentle|slow|cinematic|smooth|serene|polished/.test(text);
  const tour = /store tour|tour|whole store|entire store|overview|show the store|walk through|walkthrough|shelves|selection/.test(text);
  const detail = /close[- ]?up|detail|label|product|feature|focus on|spotlight/.test(text);
  const preferVideo = Boolean(state.reelEditPrefs?.preferVideoBoost) || /video|videos|footage|reel|movement|moving|clips?/.test(text);
  const preserveFullVideo = /full video|whole video|entire video|do not cut|don't cut|uncut|keep.*whole/.test(text);
  const short = /short|brief|under \d+ seconds?|very quick/.test(text);
  const pace = fast && !slow ? 'fast' : slow && !fast ? 'smooth' : 'balanced';
  const baseClipMs = short ? 2200 : pace === 'fast' ? 2500 : pace === 'smooth' ? 3900 : 3200;
  const clipScale = clamp(Number(state.reelEditPrefs?.clipScale || 1), .65, 1.8);
  const transitionMs = clamp(Number(state.reelEditPrefs?.transitionMs || (pace === 'fast' ? 200 : pace === 'smooth' ? 460 : 320)), 0, 700);
  return {
    pace,
    tour,
    detail,
    preferVideo,
    preserveFullVideo,
    clipMs: Math.round(baseClipMs * clipScale),
    photoMs: short ? 1500 : pace === 'fast' ? 1850 : pace === 'smooth' ? 3100 : 2350,
    maxSlides: short ? 4 : pace === 'fast' ? 6 : pace === 'smooth' ? 5 : 6,
    transitionMs,
  };
}

function chooseReelMotion(item, photo, index, total) {
  const text = String(typeof item === 'string'
    ? item
    : `${item?.title || ''} ${item?.detail || ''} ${item?.note || ''} ${item?.overlayText || ''}`).toLowerCase();
  const portrait = Boolean(photo?.height && photo?.width && photo.height / photo.width > 1.18);
  const veryWide = Boolean(photo?.width && photo?.height && photo.width / photo.height > 1.35);
  const intent = editingIntentFromDescription();

  if (/close|detail|label|single|feature|focus|product/.test(text)) return index % 2 ? 'zoom_in_soft' : 'zoom_in';
  if (/wide|shelf|display|range|tour|overview|selection|wall/.test(text)) {
    if (portrait) return index % 2 ? 'pan_down' : 'pan_up';
    return index % 2 ? 'pan_left' : 'pan_right';
  }
  if (/top|upper/.test(text)) return 'pan_up';
  if (/bottom|lower/.test(text)) return 'pan_down';
  if (intent.tour && !intent.detail) return portrait ? (index % 2 ? 'pan_down' : 'pan_up') : (index % 2 ? 'pan_left' : 'pan_right');
  if (intent.detail && !intent.tour) return index % 2 ? 'zoom_in_soft' : 'zoom_in';
  if (intent.pace === 'smooth' && index % 3 === 2) return 'still';
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
  const videoMatch = text.match(/video\s*(\d+)/i);
  if (videoMatch) {
    const source = allVideoSources()[Math.max(0, Number(videoMatch[1]) - 1)];
    if (source) {
      const frames = state.photos.map((photo, index) => photo.sourceType === 'videoFrame' && (!photo.videoId || photo.videoId === source.id) ? index : -1).filter((index) => index >= 0);
      if (frames.length) return frames[Math.floor(frames.length / 2)];
    }
  }
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

function continuousVideoSegment(source = primaryVideoSource()) {
  const duration = Number(source?.duration || 0);
  if (!duration) return null;
  const start = duration > 1.2 ? 0.08 : 0;
  const safeEnd = Math.max(start + 0.25, duration - 0.03);
  // Preserve the full recording for normal short clips. Earlier builds capped the
  // source too aggressively, which could make a good video feel abruptly cut off.
  if (duration <= 30) return {start, end: safeEnd, duration: Math.round((safeEnd - start) * 1000)};
  const end = Math.min(safeEnd, start + 20);
  return {start, end, duration: Math.round((end - start) * 1000)};
}

function makeVideoSegmentFromFrame(photo, source, item = null, fallbackDuration = 1800) {
  if (!photo || !source) return null;
  const intent = editingIntentFromDescription();
  const aiRequested = reelDurationMs(item || '') || fallbackDuration || intent.clipMs;
  // Pal should not race through normal footage just because an AI shot note happens to say 1–2 seconds.
  // Use the creative brief as a floor, then let the Reel feedback controls adjust from there.
  const requested = Math.max(aiRequested, intent.clipMs);
  const sourceScale = clamp(Number(state.reelEditPrefs?.sourceScales?.[source.id] || 1), .55, 1.8);
  const paced = requested * sourceScale;
  const minSec = intent.pace === 'fast' ? 2.2 : 2.6;
  const maxSec = intent.pace === 'smooth' ? 4.6 : 4.1;
  const sourceDuration = Math.max(.2, Number(source.duration || 0));
  const durationSec = Math.min(sourceDuration, maxSec, Math.max(Math.min(minSec, sourceDuration), paced / 1000));
  const midpoint = Number(photo.videoTime || 0);
  const start = Math.max(0, Math.min(midpoint - durationSec * 0.45, Math.max(0, sourceDuration - durationSec - 0.03)));
  const end = Math.min(sourceDuration, start + durationSec);
  return {
    dataUrl: photo.dataUrl,
    overlay: String(item?.overlayText || state.result?.overlayText || ''),
    title: typeof item === 'object' ? String(item.title || '') : 'Video clip',
    duration: Math.round((end - start) * 1000),
    sourceIndex: state.photos.indexOf(photo),
    sourceType: 'video',
    sourceVideoId: source.id,
    videoStart: start,
    videoEnd: end,
    motionType: 'video',
  };
}

function representativeFrameForSource(source, offset = 0) {
  const frames = state.photos.filter((photo) => photo.sourceType === 'videoFrame' && (!photo.videoId || photo.videoId === source?.id));
  if (!frames.length) return null;
  const variant = Math.max(0, Number(state.reelEditPrefs?.variant || 0));
  const preferred = Math.min(frames.length - 1, Math.max(0, Math.floor(frames.length / 2) + ((variant + offset) % 3) - 1));
  return frames[preferred] || frames[Math.floor(frames.length / 2)] || frames[0];
}

function orderedVideoSourcesForEdit() {
  const sources = [...allVideoSources()];
  if (sources.length < 2) return sources;
  const variant = Math.max(0, Number(state.reelEditPrefs?.variant || 0));
  const shift = variant % sources.length;
  return [...sources.slice(shift), ...sources.slice(0, shift)];
}

function fallbackVideoSlides(maxSlides = 3) {
  const slides = [];
  const sources = orderedVideoSourcesForEdit();

  // First pass: give every uploaded video a chance to appear before taking a second moment
  // from any one clip. This makes multi-video projects feel intentionally edited.
  sources.forEach((source, index) => {
    if (slides.length >= maxSlides) return;
    const frame = representativeFrameForSource(source, index);
    const slide = makeVideoSegmentFromFrame(frame, source, {title: `Video ${index + 1}`, detail: 'Auto-picked strongest continuous moment', overlayText: state.result?.overlayText || state.result?.reelHook || ''}, editingIntentFromDescription().clipMs);
    if (slide) slides.push(slide);
  });

  // Second pass: only add extra moments after each source has been represented once.
  if (slides.length < maxSlides) {
    sources.forEach((source) => {
      const frames = state.photos.filter((photo) => photo.sourceType === 'videoFrame' && (!photo.videoId || photo.videoId === source.id));
      for (const frame of frames) {
        if (slides.length >= maxSlides) break;
        if (slides.some((slide) => slide.sourceVideoId === source.id && Math.abs(Number(slide.videoStart || 0) - Math.max(0, Number(frame.videoTime || 0) - 1)) < .8)) continue;
        const slide = makeVideoSegmentFromFrame(frame, source, {title: 'Extra video moment', detail: 'Secondary highlight', overlayText: state.result?.overlayText || ''}, editingIntentFromDescription().clipMs);
        if (slide) slides.push(slide);
      }
    });
  }

  if (!slides.length) {
    const first = primaryVideoSource();
    const segment = continuousVideoSegment(first);
    const frame = representativeFrameForSource(first);
    if (first && segment) {
      slides.push({
        dataUrl: frame?.dataUrl || '',
        overlay: String(state.result?.reelHook || state.result?.overlayText || ''),
        title: 'Video highlight',
        duration: segment.duration,
        sourceIndex: frame ? state.photos.indexOf(frame) : -1,
        sourceType: 'video',
        sourceVideoId: first.id,
        videoStart: segment.start,
        videoEnd: segment.end,
        motionType: 'video',
      });
    }
  }
  return slides;
}

function buildReelSlides() {
  if (!state.photos.length && !allVideoSources().length) return [];
  const intent = editingIntentFromDescription();
  const maxSlides = intent.maxSlides;
  const plan = Array.isArray(state.result?.reelPlan) ? state.result.reelPlan : [];
  const slides = [];
  const usedPhotoIndexes = new Set();
  const usedVideoMoments = new Set();
  const nonVideoPhotos = state.photos.filter((photo) => photo.sourceType !== 'videoFrame');
  const sources = allVideoSources();

  // Explicit direction such as “use the full/whole video” wins over automatic highlight cutting.
  if (intent.preserveFullVideo && sources.length === 1 && !nonVideoPhotos.length) {
    const source = sources[0];
    const segment = continuousVideoSegment(source);
    const frame = state.photos.find((photo) => photo.sourceType === 'videoFrame' && (!photo.videoId || photo.videoId === source.id));
    if (segment) {
      return [{
        dataUrl: frame?.dataUrl || '',
        overlay: String(state.result?.reelHook || state.result?.overlayText || ''),
        title: 'Full video',
        duration: segment.duration,
        sourceIndex: frame ? state.photos.indexOf(frame) : -1,
        sourceType: 'video',
        sourceVideoId: source.id,
        videoStart: segment.start,
        videoEnd: segment.end,
        motionType: 'video',
      }];
    }
  }

  // For video-only projects with multiple source clips, favor one strong, watchable moment
  // from each uploaded video before considering extra cuts. This avoids rapid 1-second hopping.
  if (sources.length > 1 && !nonVideoPhotos.length) {
    return fallbackVideoSlides(Math.min(maxSlides, Math.max(sources.length, state.reelEditPrefs?.preferVideoBoost ? maxSlides : sources.length)));
  }

  for (let i = 0; i < plan.length && slides.length < maxSlides; i += 1) {
    const item = plan[i];
    const mediaIndex = parseReelMediaIndex(item, i);
    const photo = state.photos[mediaIndex];
    if (!photo) continue;
    if (photo.sourceType === 'videoFrame') {
      const source = videoSourceById(photo.videoId) || primaryVideoSource();
      const key = `${source?.id || 'video'}:${Math.round(Number(photo.videoTime || 0) * 10)}`;
      if (usedVideoMoments.has(key)) continue;
      const clip = makeVideoSegmentFromFrame(photo, source, item, intent.clipMs);
      if (!clip) continue;
      usedVideoMoments.add(key);
      slides.push(clip);
      continue;
    }
    if (usedPhotoIndexes.has(mediaIndex)) continue;
    usedPhotoIndexes.add(mediaIndex);
    const aiDuration = reelDurationMs(item);
    const duration = Math.round(intent.pace === 'fast' ? aiDuration * 0.78 : intent.pace === 'smooth' ? aiDuration * 1.18 : aiDuration);
    slides.push({
      dataUrl: photo.dataUrl,
      overlay: String(item?.overlayText || state.result?.overlayText || ''),
      title: typeof item === 'object' ? String(item.title || '') : '',
      duration: Math.max(1200, Math.min(4200, duration)),
      sourceIndex: mediaIndex,
      sourceType: 'photo',
      motionType: chooseReelMotion(item, photo, slides.length, maxSlides),
    });
  }

  // If the brief explicitly talks about footage/video but the AI plan didn't select any,
  // ensure at least one real moving clip is included before filling with stills.
  if (intent.preferVideo && sources.length && !slides.some((slide) => slide.sourceType === 'video')) {
    const clip = fallbackVideoSlides(1)[0];
    if (clip) {
      slides.unshift(clip);
      usedVideoMoments.add(`${clip.sourceVideoId || 'video'}:${Math.round(Number(clip.videoStart || 0) * 10)}`);
    }
  }

  // The explicit “Use More Video” feedback control should visibly change a mixed project,
  // not just set a flag. Aim for moving footage to occupy most of the available scenes.
  if (state.reelEditPrefs?.preferVideoBoost && sources.length) {
    const targetVideoScenes = Math.min(maxSlides - 1, Math.max(sources.length, Math.ceil(maxSlides * .65)));
    const fallbackClips = fallbackVideoSlides(targetVideoScenes);
    for (const clip of fallbackClips) {
      if (slides.filter((item) => item.sourceType === 'video').length >= targetVideoScenes || slides.length >= maxSlides) break;
      const key = `${clip.sourceVideoId || 'video'}:${Math.round(Number(clip.videoStart || 0) * 10)}`;
      if (usedVideoMoments.has(key)) continue;
      usedVideoMoments.add(key);
      slides.push(clip);
    }
  }

  for (const photo of nonVideoPhotos) {
    if (slides.length >= maxSlides) break;
    const mediaIndex = state.photos.indexOf(photo);
    if (usedPhotoIndexes.has(mediaIndex)) continue;
    usedPhotoIndexes.add(mediaIndex);
    slides.push({
      dataUrl: photo.dataUrl,
      overlay: String(state.result?.overlayText || ''),
      title: 'Photo',
      duration: intent.photoMs,
      sourceIndex: mediaIndex,
      sourceType: 'photo',
      motionType: chooseReelMotion(null, photo, slides.length, maxSlides),
    });
  }

  if (slides.length < maxSlides) {
    const fallbackClips = fallbackVideoSlides(maxSlides - slides.length);
    for (const clip of fallbackClips) {
      if (slides.length >= maxSlides) break;
      const key = `${clip.sourceVideoId || 'video'}:${Math.round(Number(clip.videoStart || 0) * 10)}`;
      if (usedVideoMoments.has(key)) continue;
      usedVideoMoments.add(key);
      slides.push(clip);
    }
  }

  return slides.slice(0, maxSlides);
}

function freshReelEditPrefs() {
  return {clipScale: 1, transitionMs: 320, preferVideoBoost: false, variant: 0, sourceScales: {}, feedback: ''};
}

function formatSceneDuration(ms) {
  const seconds = Math.max(.1, Number(ms || 0) / 1000);
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
}

function renderReelSceneSummary() {
  if (!els.reelSceneSummary) return;
  const slides = state.readyAssets.reelSlides || [];
  if (!slides.length) {
    els.reelSceneSummary.innerHTML = '<span class="reel-scene-chip">No Reel scenes yet</span>';
    return;
  }
  let photoCount = 0;
  const sourceOrder = new Map(allVideoSources().map((source, index) => [source.id, index + 1]));
  els.reelSceneSummary.innerHTML = slides.map((slide, index) => {
    let label;
    if (slide.sourceType === 'video') label = `Video ${sourceOrder.get(slide.sourceVideoId) || index + 1}`;
    else { photoCount += 1; label = `Photo ${photoCount}`; }
    return `<span class="reel-scene-chip">${escapeHtml(label)} · ${formatSceneDuration(slide.duration)}</span>`;
  }).join('');
}

function rebuildReelFromFeedback(message = 'Reel updated') {
  stopReelPreview();
  state.readyAssets.reelSlides = buildReelSlides();
  state.readyAssets.reelBlob = null;
  state.readyAssets.reelMime = '';
  state.readyAssets.packageBlob = null;
  if (state.readyAssets.reelSlides.length) showReelSlide(0, false);
  renderReelSceneSummary();
  if (els.downloadReelBtn) {
    els.downloadReelBtn.disabled = !state.readyAssets.reelSlides.length;
    els.downloadReelBtn.textContent = state.readyAssets.reelSlides.length ? 'Render Reel' : 'Reel unavailable';
  }
  if (els.reelReadyBadge) els.reelReadyBadge.textContent = state.readyAssets.reelSlides.length ? 'Preview ready' : 'Unavailable';
  if (els.reelFeedbackStatus) els.reelFeedbackStatus.textContent = `${message}. Preview it, then render the new Reel when you like it.`;
  if (state.result) saveCurrentProject().catch(() => {});
  showToast(message);
}

function bumpSourceScale(sourceIndex, multiplier) {
  const source = allVideoSources()[sourceIndex];
  if (!source) return false;
  state.reelEditPrefs.sourceScales[source.id] = clamp(Number(state.reelEditPrefs.sourceScales[source.id] || 1) * multiplier, .55, 1.8);
  return true;
}

function applyReelAdjustment(kind) {
  state.reelEditPrefs = state.reelEditPrefs || freshReelEditPrefs();
  if (kind === 'longer') {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * 1.22, .65, 1.8);
    rebuildReelFromFeedback('Using longer video moments');
    return;
  }
  if (kind === 'faster') {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * .82, .65, 1.8);
    state.reelEditPrefs.transitionMs = Math.min(Number(state.reelEditPrefs.transitionMs || 320), 220);
    rebuildReelFromFeedback('Pacing made faster');
    return;
  }
  if (kind === 'slower') {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * 1.18, .65, 1.8);
    rebuildReelFromFeedback('Pacing made calmer');
    return;
  }
  if (kind === 'smooth') {
    state.reelEditPrefs.transitionMs = Math.max(Number(state.reelEditPrefs.transitionMs || 320), 500);
    rebuildReelFromFeedback('Transitions made softer');
    return;
  }
  if (kind === 'more_video') {
    state.reelEditPrefs.preferVideoBoost = true;
    rebuildReelFromFeedback('Giving moving footage more priority');
    return;
  }
  if (kind === 'another') {
    state.reelEditPrefs.variant = Number(state.reelEditPrefs.variant || 0) + 1;
    rebuildReelFromFeedback('Trying a different edit');
  }
}

function applyFreeformReelFeedback() {
  const raw = String(els.reelFeedbackText?.value || '').trim();
  if (!raw) {
    showToast('Tell Pal what you want changed');
    return;
  }
  state.reelEditPrefs = state.reelEditPrefs || freshReelEditPrefs();
  state.reelEditPrefs.feedback = raw;
  const text = raw.toLowerCase();
  const notes = [];
  const hasOrdinalReference = /first|1st|video\s*1|second|2nd|video\s*2|third|3rd|video\s*3|fourth|4th|video\s*4/.test(text);

  if (!hasOrdinalReference && /longer|hold .*long|more time|linger/.test(text)) {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * 1.18, .65, 1.8);
    notes.push('longer clips');
  }
  if (!hasOrdinalReference && /shorter|quicker clips?|tighter clips?/.test(text)) {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * .82, .65, 1.8);
    notes.push('shorter clips');
  }
  if (/faster|more energy|energetic|upbeat|punchy|quicker pace|speed it up/.test(text)) {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * .86, .65, 1.8);
    state.reelEditPrefs.transitionMs = Math.min(Number(state.reelEditPrefs.transitionMs || 320), 220);
    notes.push('faster pacing');
  }
  if (/slower|calmer|calm|elegant|refined|more relaxed|slow it down/.test(text)) {
    state.reelEditPrefs.clipScale = clamp(Number(state.reelEditPrefs.clipScale || 1) * 1.16, .65, 1.8);
    notes.push('slower pacing');
  }
  if (/smooth|softer|soft transition|gentle transition|crossfade|less abrupt|no flash/.test(text)) {
    state.reelEditPrefs.transitionMs = Math.max(Number(state.reelEditPrefs.transitionMs || 320), 500);
    notes.push('smoother transitions');
  }
  if (/more video|more footage|mostly video|use the videos/.test(text)) {
    state.reelEditPrefs.preferVideoBoost = true;
    notes.push('more video');
  }
  if (/another edit|different edit|change the order|different order|try again/.test(text)) {
    state.reelEditPrefs.variant = Number(state.reelEditPrefs.variant || 0) + 1;
    notes.push('different edit');
  }

  const ordinalPatterns = [
    [/first|1st|video\s*1/, 0],
    [/second|2nd|video\s*2/, 1],
    [/third|3rd|video\s*3/, 2],
    [/fourth|4th|video\s*4/, 3],
  ];
  ordinalPatterns.forEach(([pattern, index]) => {
    if (!pattern.test(text)) return;
    if (/longer|hold|more time|linger/.test(text) && bumpSourceScale(index, 1.35)) notes.push(`video ${index + 1} longer`);
    if (/shorter|less time|trim/.test(text) && bumpSourceScale(index, .72)) notes.push(`video ${index + 1} shorter`);
  });

  rebuildReelFromFeedback(notes.length ? `Applied: ${[...new Set(notes)].join(', ')}` : 'Reel rebuilt from your feedback');
}

function captureReelPreviewVisual() {
  const video = els.reelPreviewVideo;
  if (video && !video.classList.contains('hidden') && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(720, video.videoWidth);
      canvas.height = Math.max(1, Math.round(canvas.width * (video.videoHeight / video.videoWidth)));
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .82);
    } catch (error) {
      console.info('Could not capture current Reel preview frame', error);
    }
  }
  const image = els.reelPreviewImage;
  if (image && !image.classList.contains('hidden') && image.src && image.complete) return image.src;
  return '';
}

function clearReelPreviewBackdrop() {
  if (!els.reelPreview) return;
  els.reelPreview.style.backgroundImage = 'none';
  els.reelPreview.style.backgroundSize = 'cover';
  els.reelPreview.style.backgroundPosition = 'center';
  els.reelPreview.style.backgroundRepeat = 'no-repeat';
}

function stopReelPreview() {
  if (state.reelPreviewTimer) clearTimeout(state.reelPreviewTimer);
  state.reelPreviewTimer = null;
  state.reelPreviewRunId = Number(state.reelPreviewRunId || 0) + 1;
  els.playReelBtn.textContent = '▶ Play preview';
  els.reelPreview.classList.remove('playing');
  try { els.reelPreviewVideo?.pause(); } catch {}
  if (els.reelPreviewVideo) els.reelPreviewVideo.style.opacity = '1';
  if (els.reelPreviewImage) els.reelPreviewImage.style.opacity = '1';
  clearReelPreviewBackdrop();
}

async function showReelSlide(index, animate = true, runId = null) {
  const slides = state.readyAssets.reelSlides || [];
  if (!slides.length) return false;
  const normalizedIndex = index % slides.length;
  const slide = slides[normalizedIndex];
  const transitionMs = Math.max(0, Number(editingIntentFromDescription().transitionMs || 0));
  const previousVisual = captureReelPreviewVisual();
  state.reelPreviewIndex = normalizedIndex;
  els.reelPreviewHook.textContent = state.reelPreviewIndex === 0 ? (state.result?.reelHook || '') : '';
  els.reelPreviewOverlay.textContent = slide.overlay || '';
  els.reelProgress.style.width = `${((state.reelPreviewIndex + 1) / slides.length) * 100}%`;

  const stillCurrent = () => runId == null || Number(state.reelPreviewRunId || 0) === runId;
  const stageTransition = (mediaElement) => {
    if (!mediaElement || !stillCurrent()) return;
    mediaElement.style.transitionProperty = 'opacity';
    mediaElement.style.transitionTimingFunction = 'ease';
    mediaElement.style.transitionDuration = `${transitionMs}ms`;
    if (animate && previousVisual && transitionMs > 0) {
      // Important: use the ACTUAL frame that was on screen, never a sampled analysis
      // thumbnail. Earlier builds used slide.dataUrl here for video scenes, which caused
      // the close-up flashes the user could see between clips.
      els.reelPreview.style.backgroundImage = `url("${previousVisual}")`;
      els.reelPreview.style.backgroundSize = 'cover';
      els.reelPreview.style.backgroundPosition = 'center';
      els.reelPreview.style.backgroundRepeat = 'no-repeat';
      mediaElement.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (stillCurrent()) mediaElement.style.opacity = '1';
      }));
      setTimeout(() => {
        if (stillCurrent() && state.reelPreviewIndex === normalizedIndex) clearReelPreviewBackdrop();
      }, transitionMs + 90);
    } else {
      mediaElement.style.opacity = '1';
      clearReelPreviewBackdrop();
    }
  };

  const slideVideoSource = slide.sourceType === 'video' ? (videoSourceById(slide.sourceVideoId) || primaryVideoSource()) : null;
  if (slide.sourceType === 'video' && slideVideoSource?.objectUrl && els.reelPreviewVideo) {
    const previewVideo = els.reelPreviewVideo;
    try { previewVideo.pause(); } catch {}
    if (previousVisual && animate && transitionMs > 0) {
      els.reelPreview.style.backgroundImage = `url("${previousVisual}")`;
      els.reelPreview.style.backgroundSize = 'cover';
      els.reelPreview.style.backgroundPosition = 'center';
    }
    previewVideo.style.opacity = previousVisual && animate && transitionMs > 0 ? '0' : '1';
    els.reelPreviewImage.classList.add('hidden');
    previewVideo.classList.remove('hidden');
    if (previewVideo.src !== slideVideoSource.objectUrl) {
      previewVideo.src = slideVideoSource.objectUrl;
      try { previewVideo.load(); } catch {}
    }
    try {
      if (previewVideo.readyState < 1) await waitForMediaEvent(previewVideo, 'loadedmetadata');
      if (!stillCurrent()) return false;
      // Wait for the requested moment to be decoded BEFORE revealing or starting the
      // scene. This prevents the momentary wrong/old frame that looked like a jump.
      await seekVideoRobust(previewVideo, Math.max(0, Number(slide.videoStart || 0)));
      if (!stillCurrent()) return false;
      stageTransition(previewVideo);
      if (animate) await previewVideo.play().catch(() => {});
      else previewVideo.pause();
      return true;
    } catch (error) {
      console.info('Reel preview seek failed; showing the source without a sampled-frame fallback', error);
      if (!stillCurrent()) return false;
      clearReelPreviewBackdrop();
      previewVideo.style.opacity = '1';
      if (animate) previewVideo.play().catch(() => {});
      return true;
    }
  }

  if (els.reelPreviewVideo) {
    try { els.reelPreviewVideo.pause(); } catch {}
    els.reelPreviewVideo.classList.add('hidden');
    els.reelPreviewVideo.style.opacity = '1';
  }
  els.reelPreviewImage.classList.remove('hidden');
  els.reelPreviewImage.classList.remove('scene-enter');
  const previewMotion = previewMotionTransforms(slide.motionType);
  els.reelPreviewImage.style.setProperty('--reel-start-transform', previewMotion.start);
  els.reelPreviewImage.style.setProperty('--reel-end-transform', previewMotion.end);
  els.reelPreviewImage.style.setProperty('--reel-duration', `${Math.max(1200, slide.duration)}ms`);
  els.reelPreviewImage.src = slide.dataUrl;
  if (els.reelPreviewImage.decode) await els.reelPreviewImage.decode().catch(() => {});
  if (!stillCurrent()) return false;
  stageTransition(els.reelPreviewImage);
  if (animate) requestAnimationFrame(() => els.reelPreviewImage.classList.add('scene-enter'));
  return true;
}

function playReelPreview() {
  const slides = state.readyAssets.reelSlides || [];
  if (!slides.length) return;
  if (state.reelPreviewTimer || els.reelPreview.classList.contains('playing')) {
    stopReelPreview();
    return;
  }
  const runId = Number(state.reelPreviewRunId || 0) + 1;
  state.reelPreviewRunId = runId;
  els.playReelBtn.textContent = '■ Stop preview';
  els.reelPreview.classList.add('playing');
  let index = 0;

  const advance = async () => {
    if (Number(state.reelPreviewRunId || 0) !== runId) return;
    const slide = slides[index];
    const shown = await showReelSlide(index, true, runId);
    if (!shown || Number(state.reelPreviewRunId || 0) !== runId) return;
    const visibleDuration = Math.max(500, Number(slide?.duration || 1500));
    index += 1;
    if (index >= slides.length) {
      state.reelPreviewTimer = setTimeout(async () => {
        if (Number(state.reelPreviewRunId || 0) !== runId) return;
        stopReelPreview();
        await showReelSlide(0, false);
      }, visibleDuration);
      return;
    }
    // The timer begins only after the new video moment has actually been decoded and
    // shown. On iPhone this is critical; otherwise seek time steals most of the clip.
    state.reelPreviewTimer = setTimeout(advance, visibleDuration);
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

function snapshotCanvas(canvas) {
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext('2d').drawImage(canvas, 0, 0);
  return copy;
}

function crossfadeBlend(elapsedMs, transitionMs, hasPreviousFrame) {
  if (!hasPreviousFrame || !transitionMs) return 1;
  const raw = clamp(elapsedMs / transitionMs, 0, 1);
  return raw * raw * (3 - 2 * raw);
}

function beginCanvasScene(ctx, width, height, previousFrame, blend) {
  ctx.save();
  ctx.globalAlpha = 1;
  if (previousFrame) {
    // Keep the last real frame underneath the incoming scene for the full crossfade.
    // Do not expose a black canvas between scenes.
    ctx.drawImage(previousFrame, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawReelCanvasFrame(ctx, img, slide, progress, width, height, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  // Keep the exported Reel clean. Suggested hook/overlay text remains in the
  // app as reference only so the user can add final text while posting.
  drawAnimatedCoverImage(ctx, img, width, height, slide?.motionType || 'zoom_in_soft', progress);
  ctx.restore();
}


async function createSourceVideoElement(source = primaryVideoSource()) {
  const src = source?.objectUrl;
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

async function renderOriginalVideoSegment(ctx, video, slide, width, height, previousFrame = null, transitionMs = 0) {
  const startSec = Math.max(0, Number(slide.videoStart || 0));
  const endSec = Math.max(startSec + 0.15, Number(slide.videoEnd || startSec + (slide.duration || 1000) / 1000));
  await seekVideoElement(video, startSec);
  await ensureVideoFrameDecoded(video).catch(() => {});
  video.playbackRate = 1;
  await video.play().catch(() => {});
  const segmentMs = Math.max(150, (endSec - startSec) * 1000);
  const started = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / segmentMs);
      const blend = crossfadeBlend(elapsed, transitionMs, Boolean(previousFrame));
      beginCanvasScene(ctx, width, height, previousFrame, blend);
      ctx.save();
      ctx.globalAlpha = blend;
      drawCoverImage(ctx, video, width, height, 1.0, .42);
      ctx.restore();
      if (progress < 1 && Number(video.currentTime || 0) < endSec - 0.015) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  video.pause();
}

function drawStoryVideoOverlay(ctx, width, height) {
  const overlay = state.result?.storyOverlayText || state.result?.postOverlayText || state.result?.headline || '';
  const cta = state.result?.cta || '';
  const profile = getProfile();
  const brand = profile.businessName || 'Social Media Pal';
  const gradient = ctx.createLinearGradient(0, height * .45, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.70)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const left = 48;
  const maxWidth = width - 96;
  const topY = height * .67;
  const block = drawTextBlock(ctx, overlay, left, topY, maxWidth, 4, 54, 1.05, '#fff', 850);
  ctx.font = '600 22px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  const ctaLines = wrapText(ctx, cta, maxWidth).slice(0, 3);
  const ctaY = topY + block.height + 24;
  ctaLines.forEach((line, i) => ctx.fillText(line, left, ctaY + i * 29));
  ctx.font = '700 17px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.fillText(brand, left, height - 58);
}

async function exportStoryVideo({returnBlob = false} = {}) {
  const source = primaryVideoSource();
  const segment = continuousVideoSegment(source);
  if (!segment || !source?.objectUrl) return null;
  if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    showAuthNotice('This browser can preview the moving Story but cannot export video on this device.');
    return null;
  }
  const mimeType = chooseRecordingMimeType();
  if (!mimeType) return null;
  els.downloadStoryBtn.disabled = true;
  els.downloadStoryBtn.textContent = 'Rendering Story…';
  if (els.storyReadyBadge) els.storyReadyBadge.textContent = 'Rendering';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(24);
    const recorder = new MediaRecorder(stream, {mimeType, videoBitsPerSecond: 5_000_000});
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
    const stopped = new Promise((resolve) => recorder.addEventListener('stop', resolve, {once: true}));
    recorder.start(500);
    const video = await createSourceVideoElement(source);
    await seekVideoElement(video, segment.start);
    video.playbackRate = 1;
    await video.play().catch(() => {});
    const started = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / segment.duration);
        ctx.save();
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawCoverImage(ctx, video, canvas.width, canvas.height, 1, .42);
        drawStoryVideoOverlay(ctx, canvas.width, canvas.height);
        ctx.restore();
        if (progress < 1 && Number(video.currentTime || 0) < segment.end - .015) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    video.pause();
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, {type: mimeType});
    state.readyAssets.storyVideoBlob = blob;
    state.readyAssets.storyMime = mimeType;
    state.readyAssets.packageBlob = null;
    if (els.storyReadyBadge) els.storyReadyBadge.textContent = 'Ready to save';
    if (!returnBlob) {
      els.downloadStoryBtn.textContent = 'Save / Share Story Video';
      showToast('Moving Story ready — tap Save / Share');
    }
    return blob;
  } catch (error) {
    console.error(error);
    showAuthNotice('The moving Story preview is ready, but Story video export failed on this device.');
    return null;
  } finally {
    els.downloadStoryBtn.disabled = false;
    if (state.readyAssets.storyVideoBlob) els.downloadStoryBtn.textContent = 'Save / Share Story Video';
    else els.downloadStoryBtn.textContent = 'Render Story Video';
  }
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
    const fps = 30;
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {mimeType, videoBitsPerSecond: 5_000_000});
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
    const stopped = new Promise((resolve) => recorder.addEventListener('stop', resolve, {once: true}));
    recorder.start(500);

    const loaded = await Promise.all(slides.map((slide) => slide.sourceType === 'video' ? null : loadImageFromDataUrl(slide.dataUrl)));
    const videoIds = [...new Set(slides.filter((slide) => slide.sourceType === 'video').map((slide) => slide.sourceVideoId).filter(Boolean))];
    const sourceVideos = {};
    for (const videoId of videoIds) {
      const source = videoSourceById(videoId) || primaryVideoSource();
      if (source) sourceVideos[videoId] = await createSourceVideoElement(source);
    }
    let previousFrame = null;
    const transitionMs = Math.max(0, Number(editingIntentFromDescription().transitionMs || 0));
    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      const sceneTransitionMs = i === 0 ? 0 : transitionMs;
      if (slide.sourceType === 'video') {
        const sourceVideo = sourceVideos[slide.sourceVideoId] || sourceVideos[videoIds[0]] || null;
        if (sourceVideo) {
          await renderOriginalVideoSegment(ctx, sourceVideo, slide, canvas.width, canvas.height, previousFrame, sceneTransitionMs);
          previousFrame = snapshotCanvas(canvas);
          continue;
        }
      }
      const img = loaded[i] || await loadImageFromDataUrl(slide.dataUrl);
      const start = performance.now();
      await new Promise((resolve) => {
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(1, elapsed / slide.duration);
          const blend = crossfadeBlend(elapsed, sceneTransitionMs, Boolean(previousFrame));
          beginCanvasScene(ctx, canvas.width, canvas.height, previousFrame, blend);
          drawReelCanvasFrame(ctx, img, slide, progress, canvas.width, canvas.height, blend);
          if (progress < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      previousFrame = snapshotCanvas(canvas);
    }
    Object.values(sourceVideos).forEach((sourceVideo) => {
      try { sourceVideo.pause(); } catch {}
      sourceVideo.removeAttribute('src');
      sourceVideo.load?.();
    });
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, {type: mimeType});
    state.readyAssets.reelBlob = blob;
    state.readyAssets.reelMime = mimeType;
    state.readyAssets.packageBlob = null;
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
  const labels = {feed: 'Post', story: 'Story', reel: 'Reel'};
  els.approveBtns?.forEach((button) => {
    const key = button.dataset.approve;
    const approved = Boolean(state.approvedAssets?.[key]);
    button.classList.toggle('approved', approved);
    button.textContent = approved ? `✓ Using ${labels[key] || 'This'}` : `✓ Use This ${labels[key] || ''}`;
  });
  const approvedCount = Object.values(state.approvedAssets || {}).filter(Boolean).length;
  if (els.approvalCount) els.approvalCount.textContent = `${approvedCount}/3`;
}

els.assetTabs?.forEach((button) => button.addEventListener('click', () => activateAssetTab(button.dataset.assetTab)));
els.nextAssetBtns?.forEach((button) => button.addEventListener('click', () => {
  activateAssetTab(button.dataset.nextAsset || 'feed');
  els.workerAssets?.scrollIntoView({behavior: 'smooth', block: 'start'});
}));
els.approveBtns?.forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.approve;
  if (!key) return;
  state.approvedAssets[key] = !state.approvedAssets[key];
  refreshApprovalButtons();
  showToast(state.approvedAssets[key] ? `${key === 'feed' ? 'Post' : key === 'story' ? 'Story' : 'Reel'} approved` : 'Approval removed');
}));

async function ensureWorkerStillFromVideo() {
  if (state.photos.length) return state.photos[0];
  const source = primaryVideoSource();
  if (!source?.objectUrl) return null;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = source.objectUrl;
  try {
    if (video.readyState < 1) await waitForMediaEvent(video, 'loadedmetadata');
    await seekVideoRobust(video, Math.min(Math.max(0.05, Number(source.duration || 1) * 0.3), Math.max(0, Number(source.duration || 1) - 0.05)));
    const dataUrl = captureVideoCanvasFrame(video);
    const photo = {name: `${source.name || 'video'} — fallback frame`, dataUrl, sourceType: 'videoFrame', videoName: source.name || '', videoTime: Number(video.currentTime || 0), videoId: source.id};
    state.photos.push(photo);
    renderPhotos();
    refreshSelectedPhotoOptions();
    return photo;
  } catch (error) {
    console.info('Could not create fallback still from video', error);
    return null;
  } finally {
    try { video.pause(); } catch {}
    video.removeAttribute('src');
    video.load?.();
  }
}

async function renderWorkerAssets() {
  if (!state.result || (!state.photos.length && !allVideoSources().length) || !els.workerAssets) {
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
    if (!state.photos.length && allVideoSources().length) await ensureWorkerStillFromVideo();
    if (!state.photos.length) throw new Error('No still frame could be prepared from the video.');
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
    state.readyAssets.storyVideoBlob = null;
    state.readyAssets.storyMime = '';
    state.readyAssets.reelSlides = buildReelSlides();
    state.readyAssets.reelBlob = null;
    state.readyAssets.reelMime = '';
    state.readyAssets.packageBlob = null;
    renderReelSceneSummary();
    if (els.reelFeedbackStatus) els.reelFeedbackStatus.textContent = 'Want a different cut? Use the controls below and Pal will rebuild only the Reel.';
    els.feedAssetPreview.src = feed;
    els.storyAssetPreview.src = story;
    const storyVideoSource = primaryVideoSource();
    const hasStoryVideo = Boolean(storyVideoSource?.objectUrl && storyVideoSource?.duration);
    if (hasStoryVideo && els.storyAssetPreviewVideo) {
      els.storyAssetPreview.classList.add('hidden');
      els.storyAssetPreviewVideo.classList.remove('hidden');
      els.storyAssetPreviewVideo.src = storyVideoSource.objectUrl;
      els.storyAssetPreviewVideo.currentTime = 0;
      els.storyAssetPreviewVideo.play().catch(() => {});
      if (els.storyVideoOverlay) els.storyVideoOverlay.classList.remove('hidden');
      if (els.storyVideoOverlayTitle) els.storyVideoOverlayTitle.textContent = state.result?.storyOverlayText || state.result?.postOverlayText || state.result?.headline || '';
      if (els.storyVideoOverlayCta) els.storyVideoOverlayCta.textContent = state.result?.cta || '';
      if (els.storyAssetTitle) els.storyAssetTitle.textContent = '9:16 Moving Story';
      if (els.storyReadyBadge) els.storyReadyBadge.textContent = 'Preview ready';
    } else {
      els.storyAssetPreview.classList.remove('hidden');
      if (els.storyAssetPreviewVideo) { try { els.storyAssetPreviewVideo.pause(); } catch {}; els.storyAssetPreviewVideo.classList.add('hidden'); }
      if (els.storyVideoOverlay) els.storyVideoOverlay.classList.add('hidden');
      if (els.storyAssetTitle) els.storyAssetTitle.textContent = '9:16 Story';
      if (els.storyReadyBadge) els.storyReadyBadge.textContent = 'Ready';
    }
    if (state.readyAssets.reelSlides.length) showReelSlide(0, false);
    if (els.palPick) {
      const hasVideo = allVideoSources().length > 0;
      const pick = hasVideo ? 'Reel' : 'Post';
      const reason = hasVideo ? 'Best fit for your moving footage — I’d review the Reel first.' : 'Strongest finished visual from this set — I’d review the Post first.';
      els.palPick.innerHTML = `<span>★ PAL'S PICK: ${pick.toUpperCase()}</span><strong>${reason}</strong>`;
    }
    els.downloadFeedBtn.disabled = false;
    els.downloadStoryBtn.disabled = false;
    els.downloadPackageBtn.disabled = false;
    els.downloadFeedBtn.textContent = 'Save / Share Post';
    els.downloadStoryBtn.textContent = hasStoryVideo ? 'Render Story Video' : 'Save / Share Story';
    els.downloadPackageBtn.textContent = 'Prepare package';
    els.downloadReelBtn.disabled = !state.readyAssets.reelSlides.length;
    els.downloadReelBtn.textContent = state.readyAssets.reelSlides.length ? 'Render Reel' : 'Reel unavailable';
    activateAssetTab(allVideoSources().length ? 'reel' : (state.activeAssetTab || 'feed'));
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
    if (primaryVideoSource()?.objectUrl && !state.readyAssets.storyVideoBlob && globalThis.MediaRecorder && HTMLCanvasElement.prototype.captureStream) {
      els.downloadPackageBtn.textContent = 'Rendering Story…';
      await exportStoryVideo({returnBlob: true});
      els.downloadPackageBtn.textContent = 'Building package…';
    }
    const feedBlob = await dataUrlToBlob(state.readyAssets.feed);
    const storyBlob = await dataUrlToBlob(state.readyAssets.story);
    zip.file('01-feed-post-4x5.jpg', feedBlob);
    if (state.readyAssets.storyVideoBlob) {
      const storyExt = state.readyAssets.storyMime.includes('mp4') ? 'mp4' : 'webm';
      zip.file(`02-story-video.${storyExt}`, state.readyAssets.storyVideoBlob);
      zip.file('02b-story-still.jpg', storyBlob);
    } else {
      zip.file('02-story-9x16.jpg', storyBlob);
    }
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
els.downloadStoryBtn?.addEventListener('click', async () => {
  const hasStoryVideo = Boolean(primaryVideoSource()?.objectUrl && primaryVideoSource()?.duration);
  if (hasStoryVideo) {
    if (!state.readyAssets.storyVideoBlob) {
      await exportStoryVideo({returnBlob: false});
      return;
    }
    const ext = state.readyAssets.storyMime.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([state.readyAssets.storyVideoBlob], `social-media-pal-story.${ext}`, {type: state.readyAssets.storyMime || state.readyAssets.storyVideoBlob.type || 'video/mp4'});
    await shareOrSaveFile(file, {title: 'Social Media Pal Story'});
    return;
  }
  await shareDataUrlAsset(state.readyAssets.story, 'social-media-pal-story.jpg', 'Social Media Pal Story');
});
els.playReelBtn?.addEventListener('click', playReelPreview);
els.reelAdjustBtns?.forEach((button) => button.addEventListener('click', () => applyReelAdjustment(button.dataset.reelAdjust)));
els.applyReelFeedbackBtn?.addEventListener('click', applyFreeformReelFeedback);
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
  const existing = state.activeProjectId ? state.recentProjects.find((item) => item.id === state.activeProjectId) : null;
  return {
    id: state.activeProjectId || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
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
    videoSource: serializableVideoSource(primaryVideoSource()),
    videoSources: serializableVideoSources(),
    reelEditPrefs: JSON.parse(JSON.stringify(state.reelEditPrefs || freshReelEditPrefs())),
    result: state.result,
    historyMediaCompressed: true,
  };
}

async function saveCurrentProject() {
  if (!state.result) return;
  const snapshot = await currentProjectSnapshot();
  const deduped = state.recentProjects.filter((item) => item.id !== snapshot.id && !(item.headline === snapshot.headline && item.description === snapshot.description));
  state.recentProjects = [snapshot, ...deduped].slice(0, MAX_RECENT_PROJECTS);
  state.activeProjectId = snapshot.id;
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
        save([{...snapshot, photos: [], videoSource: null, videoSources: []}]);
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
    const legacyRaw = localStorage.getItem('socialStudioRecentProjectsV16') || localStorage.getItem('socialStudioRecentProjectsV15') || localStorage.getItem('socialStudioRecentProjectsV14') || localStorage.getItem('socialStudioRecentProjectsV12') || localStorage.getItem('socialStudioRecentProjectsV11') || localStorage.getItem('socialStudioRecentProjectsV10') || localStorage.getItem('socialStudioRecentProjectsV09') || localStorage.getItem('socialStudioRecentProjectsV08');
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
    const projectVideoCount = Array.isArray(project.videoSources) && project.videoSources.length ? project.videoSources.length : (project.videoSource ? 1 : 0);
    if (projectVideoCount) mediaBits.push(`${projectVideoCount} video${projectVideoCount === 1 ? '' : 's'}${frameCount ? ` • ${frameCount} analysis frame${frameCount === 1 ? '' : 's'}` : ''}`);
    if (!mediaBits.length) mediaBits.push('saved content');
    return `<div class="recent-project">
      <button class="recent-project-open" type="button" data-project-id="${project.id}">
        <div class="recent-project-icon">${(Array.isArray(project.videoSources) && project.videoSources.length) || project.videoSource ? '🎞️' : '📷'}</div>
        <div><div class="recent-project-title">${escapeHtml(project.headline || 'Untitled project')}</div><div class="recent-project-meta">${escapeHtml(formatDateTime(project.updatedAt || project.createdAt))} • ${mediaBits.join(' • ')}</div></div>
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
    const videoIds = [project.videoSource?.id, ...((project.videoSources || []).map((item) => item?.id))].filter(Boolean);
    for (const videoId of videoIds) {
      if (videoId && !state.recentProjects.some((item) => item.videoSource?.id === videoId || (item.videoSources || []).some((source) => source?.id === videoId))) await deleteVideoBlobFromDb(videoId);
    }
    renderRecentProjects();
    if (state.activeProjectId === projectId) resetForNewProject();
    else showToast('Project deleted');
  }));
}

async function applyProject(project) {
  if (!project) return;
  state.mediaSession += 1;
  setMediaBusy(false);
  releaseCurrentVideoUrl();
  state.activeProjectId = project.id || null;
  state.photos = Array.isArray(project.photos) ? project.photos : [];
  const sourceList = Array.isArray(project.videoSources) && project.videoSources.length ? project.videoSources : (project.videoSource ? [project.videoSource] : []);
  state.videoSources = await hydrateVideoSources(sourceList);
  syncPrimaryVideoSource();
  state.result = project.result || null;
  state.reelEditPrefs = {...freshReelEditPrefs(), ...(project.reelEditPrefs || {}), sourceScales: {...(project.reelEditPrefs?.sourceScales || {})}};
  if (els.reelFeedbackText) els.reelFeedbackText.value = state.reelEditPrefs.feedback || '';
  state.readyAssets = {feed: '', story: '', storyVideoBlob: null, storyMime: '', reelSlides: [], reelBlob: null, reelMime: '', packageBlob: null};
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
  if ((project.videoSource || (project.videoSources || []).length) && !allVideoSources().some((item) => item?.blob)) showAuthNotice('Project loaded. The saved analysis frames are available, but one or more original video files could not be restored; choose the videos again to rebuild moving-footage Story/Reel exports.');
  else showToast('Project loaded');
}

async function loadProject(projectId) {
  await applyProject(state.recentProjects.find((item) => item.id === projectId));
}

els.clearProjectsBtn.addEventListener('click', async () => {
  if (state.recentProjects.length && !window.confirm('Delete all recent projects?')) return;
  const videoIds = state.recentProjects.flatMap((project) => [project.videoSource?.id, ...((project.videoSources || []).map((source) => source?.id))].filter(Boolean));
  state.recentProjects = [];
  ['socialStudioRecentProjectsV17', 'socialStudioRecentProjectsV16', 'socialStudioRecentProjectsV15', 'socialStudioRecentProjectsV14', 'socialStudioRecentProjectsV12', 'socialStudioRecentProjectsV11', 'socialStudioRecentProjectsV10', 'socialStudioRecentProjectsV09', 'socialStudioRecentProjectsV08'].forEach((key) => localStorage.removeItem(key));
  await Promise.all(videoIds.map((id) => deleteVideoBlobFromDb(id)));
  renderRecentProjects();
  resetForNewProject();
  showToast('Projects and current workspace cleared');
});

loadProfile();
loadMicPreference();
loadRecentProjects();
updateReelModeVisibility();
refreshSelectedPhotoOptions();
renderToolsState();
refreshRefineButtons();
activateView('create', {scroll: false});
initFirebase();
