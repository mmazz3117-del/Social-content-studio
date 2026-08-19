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
const MAX_MEDIA = 10;
const MAX_VIDEOS = 4;
const VIDEO_FRAME_COUNT = 2;
const CONTENT_MODE_KEY = 'socialMediaPalContentModeV2';
const MIC_MODE_KEY = 'socialMediaPalMicModeV1';
const PROJECTS_KEY = 'socialMediaPalDirectorProjectsV2';
const PROFILE_KEY = 'socialStudioProfile';
const MAX_PROJECTS = 8;

const defaultProfile = {
  businessName: 'Ocean State Spice & Tea Merchants',
  businessLocation: 'Wayland Square, Providence, Rhode Island',
  brandVoice: 'Warm, polished, knowledgeable, local, inviting, and never overly salesy. Keep the writing natural rather than generic or overhyped.',
  brandDefaults: 'Use Ocean State Spice & Tea Merchants by name when useful. Preferred local tags include #OceanStateSpiceAndTea #WaylandSquare #ProvidenceRI #ShopLocalRI. Avoid cluttering posts with too many hashtags.'
};

const generalProfile = {
  businessName: '',
  businessLocation: '',
  brandVoice: 'Natural, polished, human, context-appropriate, and never generic or overhyped.',
  brandDefaults: 'Do not assume a business, store, location, product for sale, or promotional call-to-action unless the project brief explicitly says so.'
};

const state = {
  user: null,
  authReady: false,
  loading: false,
  contentMode: 'business',
  format: 'reel',
  planStyle: 'new',
  media: [],
  videos: [],
  result: null,
  activeView: 'plan',
  shootIndex: 0,
  completedShots: new Set(),
  timer: null,
  timerEnd: 0,
  projects: [],
  voiceListening: false,
  lastWorkingMicMode: ''
};

const $ = (id) => document.getElementById(id);
const els = {
  apiStatus: $('apiStatus'), authBtn: $('authBtn'), profileBtn: $('profileBtn'), profileDialog: $('profileDialog'),
  saveProfileBtn: $('saveProfileBtn'), businessName: $('businessName'), businessLocation: $('businessLocation'), brandVoice: $('brandVoice'), brandDefaults: $('brandDefaults'),
  contentModeStatus: $('contentModeStatus'), contentModeBtns: [...document.querySelectorAll('[data-content-mode]')],
  formatBtns: [...document.querySelectorAll('[data-format]')], planStyleBtns: [...document.querySelectorAll('[data-plan-style]')], starterBtns: [...document.querySelectorAll('[data-starter]')],
  description: $('description'), tone: $('tone'), detailLevel: $('detailLevel'),
  photoInput: $('photoInput'), videoInput: $('videoInput'), mediaSummary: $('mediaSummary'), photoGrid: $('photoGrid'),
  tellPalBtn: $('tellPalBtn'), voiceStatus: $('voiceStatus'), micMode: $('micMode'), testMicBtn: $('testMicBtn'), micLevelBar: $('micLevelBar'),
  buildPlanBtn: $('buildPlanBtn'), planDialog: $('planDialog'), closePlanBtn: $('closePlanBtn'), resultHeadline: $('resultHeadline'), conceptHook: $('conceptHook'), conceptSummary: $('conceptSummary'), leadAsset: $('leadAsset'),
  shotPlanList: $('shotPlanList'), mediaReviewSection: $('mediaReviewSection'), mediaReviewList: $('mediaReviewList'), assemblyPlan: $('assemblyPlan'),
  startShootModeBtn: $('startShootModeBtn'), copyPlanBtn: $('copyPlanBtn'), goPublishBtn: $('goPublishBtn'), refineBtns: [...document.querySelectorAll('[data-refine]')],
  shootEmpty: $('shootEmpty'), shootState: $('shootState'), shootProgressText: $('shootProgressText'), shootProgressBar: $('shootProgressBar'), shootStepBadge: $('shootStepBadge'), shootChips: $('shootChips'), shootTitle: $('shootTitle'), shootDetail: $('shootDetail'), shootOverlay: $('shootOverlay'),
  timerDisplay: $('timerDisplay'), timerBtn: $('timerBtn'), prevShotBtn: $('prevShotBtn'), markShotBtn: $('markShotBtn'), nextShotBtn: $('nextShotBtn'), shotChecklist: $('shotChecklist'), exitShootBtn: $('exitShootBtn'),
  publishEmpty: $('publishEmpty'), publishState: $('publishState'), publishCards: $('publishCards'),
  projectsList: $('projectsList'), projectsEmpty: $('projectsEmpty'), clearProjectsBtn: $('clearProjectsBtn'),
  navBtns: [...document.querySelectorAll('[data-view-target]')], views: [...document.querySelectorAll('.app-view')], goBtns: [...document.querySelectorAll('[data-go]')],
  authNotice: $('authNotice'), toast: $('toast')
};

let auth = null;
let functions = null;
let googleProvider = null;
let generateSocialPackage = null;
let speechRecognition = null;
let voiceBaseText = '';
let voiceTranscript = '';
let micTestStream = null;
let micAudioContext = null;

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

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
  let profile = {...defaultProfile};
  try { profile = {...profile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')}; } catch {}
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
    brandDefaults: els.brandDefaults.value.trim()
  };
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(getProfile()));
  els.profileDialog.close();
  showToast('Business profile saved');
}

function isGeneralMode() { return state.contentMode === 'general'; }

function renderContentMode() {
  els.contentModeBtns.forEach((btn) => {
    const active = btn.dataset.contentMode === state.contentMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  els.contentModeStatus.textContent = isGeneralMode() ? 'General / Test active' : 'Business profile active';
  els.contentModeStatus.classList.toggle('test', isGeneralMode());
  els.description.placeholder = isGeneralMode()
    ? 'Example: I want a short video of a weekend hike. Make it cinematic, relaxed and simple to film.'
    : 'Example: I want a 15-second Reel featuring three new products. Make it warm, interesting and easy for me to film by myself.';
  els.starterBtns.forEach((btn) => {
    const mode = btn.dataset.mode || 'all';
    btn.classList.toggle('hidden', mode !== 'all' && mode !== state.contentMode);
  });
}

function setContentMode(mode) {
  state.contentMode = mode === 'general' ? 'general' : 'business';
  localStorage.setItem(CONTENT_MODE_KEY, state.contentMode);
  renderContentMode();
  showToast(isGeneralMode() ? 'General / Test mode on' : 'Business mode on');
}

function loadContentMode() {
  state.contentMode = localStorage.getItem(CONTENT_MODE_KEY) === 'general' ? 'general' : 'business';
  renderContentMode();
}

function renderFormat() {
  els.formatBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.format === state.format));
}

function renderPlanStyle() {
  els.planStyleBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.planStyle === state.planStyle));
}

function activateView(name) {
  state.activeView = name;
  els.views.forEach((view) => view.classList.toggle('active', view.dataset.view === name));
  els.navBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.viewTarget === name));
  if (name === 'shoot') renderShootMode();
  if (name === 'publish') renderPublishKit();
  if (name === 'projects') renderProjects();
  window.scrollTo({top:0, behavior:'smooth'});
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
    console.error(error);
    state.authReady = true;
    els.apiStatus.textContent = 'Firebase unavailable';
  }
}

function renderAuthState() {
  if (state.user) {
    els.apiStatus.textContent = 'AI ready';
    els.authBtn.textContent = 'Sign out';
  } else {
    els.apiStatus.textContent = 'Sign in to connect';
    els.authBtn.textContent = 'Sign in';
  }
}

async function signIn() {
  try {
    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    if (error?.code === 'auth/popup-blocked') {
      await auth.signInWithRedirect(googleProvider);
      return;
    }
    showAuthNotice(error?.message || 'Google sign-in could not be completed.');
  }
}

async function handleAuth() {
  if (!auth) return;
  if (state.user) {
    await auth.signOut();
    showToast('Signed out');
  } else await signIn();
}

function currentFormatLabel() {
  return ({reel:'Reel / short video', photo:'Photo post', story:'Story', campaign:'Full content plan'})[state.format] || 'Content plan';
}

function makeId(prefix='media') {
  return globalThis.crypto?.randomUUID ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
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
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .84));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function waitForMediaEvent(target, eventName, timeoutMs=12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error(`Timed out waiting for ${eventName}`)); }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(target.error || new Error(`Media error before ${eventName}`)); };
    const cleanup = () => { clearTimeout(timer); target.removeEventListener(eventName, ok); target.removeEventListener('error', bad); };
    target.addEventListener(eventName, ok, {once:true});
    target.addEventListener('error', bad, {once:true});
  });
}

async function ensureVideoFrameDecoded(video) {
  if (typeof video.requestVideoFrameCallback === 'function') {
    await Promise.race([
      new Promise((resolve) => video.requestVideoFrameCallback(resolve)),
      new Promise((resolve) => setTimeout(resolve, 900))
    ]);
  } else {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
}

async function seekVideo(video, target) {
  const safe = Math.max(0, Math.min(target, Math.max(0, Number(video.duration || 0)-.05)));
  if (Math.abs(Number(video.currentTime || 0)-safe) > .04) {
    video.currentTime = safe;
    await waitForMediaEvent(video, 'seeked', 9000).catch(async () => {
      video.muted = true;
      await video.play().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 120));
      video.pause();
      video.currentTime = safe;
      await waitForMediaEvent(video, 'seeked', 6000);
    });
  }
  await ensureVideoFrameDecoded(video);
}

function captureFrame(video) {
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth || 1, video.videoHeight || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .84);
}

async function extractVideoFrames(file, count=VIDEO_FRAME_COUNT) {
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  const url = URL.createObjectURL(file);
  video.src = url;
  video.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:.01';
  document.body.appendChild(video);
  try {
    if (video.readyState < 1) await waitForMediaEvent(video,'loadedmetadata');
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const positions = count === 1 ? [.4] : [.22,.68].slice(0,count);
    const frames = [];
    for (const ratio of positions) {
      const time = Math.min(duration * ratio, Math.max(0,duration-.05));
      try { await seekVideo(video,time); frames.push({time,dataUrl:captureFrame(video)}); } catch (error) { console.info('Frame sample skipped', error); }
    }
    if (!frames.length) {
      try { await seekVideo(video,Math.min(.1,duration*.05)); frames.push({time:.1,dataUrl:captureFrame(video)}); } catch {}
    }
    return {duration,frames};
  } finally {
    video.pause(); video.remove(); URL.revokeObjectURL(url);
  }
}

async function addFiles(files) {
  const images = files.filter((f) => /^image\/(jpeg|jpg|png|webp)$/i.test(f.type));
  const videos = files.filter((f) => String(f.type||'').startsWith('video/'));
  let slots = Math.max(0, MAX_MEDIA - state.media.length);
  for (const file of images) {
    if (!slots) break;
    try {
      const dataUrl = await optimizeImage(file);
      state.media.push({id:makeId('photo'),name:file.name,dataUrl,sourceType:'photo'});
      slots--;
    } catch { showToast(`Could not read ${file.name}`); }
  }
  const remainingVideoSlots = Math.max(0, MAX_VIDEOS - state.videos.length);
  const chosenVideos = videos.slice(0,remainingVideoSlots);
  for (const file of chosenVideos) {
    slots = Math.max(0, MAX_MEDIA - state.media.length);
    if (!slots) break;
    showToast(`Analyzing ${file.name}…`);
    try {
      const extracted = await extractVideoFrames(file, Math.min(VIDEO_FRAME_COUNT,slots));
      const videoId = makeId('video');
      const clipNumber = state.videos.length + 1;
      state.videos.push({id:videoId,name:file.name,duration:extracted.duration,frameCount:extracted.frames.length,type:file.type,size:file.size,clipIndex:clipNumber});
      extracted.frames.forEach((frame,index) => {
        state.media.push({id:makeId('frame'),name:`${file.name} — frame ${index+1}`,dataUrl:frame.dataUrl,sourceType:'videoFrame',videoId,videoName:file.name,videoTime:frame.time});
      });
    } catch (error) {
      console.error(error);
      showAuthNotice(`Could not analyze ${file.name}. Try a different MP4 or MOV clip.`);
    }
  }
  if (videos.length > remainingVideoSlots) showToast(`Up to ${MAX_VIDEOS} videos per plan`);
  renderMedia();
  els.photoInput.value=''; els.videoInput.value='';
}

function removeMedia(index) {
  const item = state.media[index];
  if (!item) return;
  state.media.splice(index,1);
  if (item.sourceType === 'videoFrame' && item.videoId && !state.media.some((m)=>m.videoId===item.videoId)) {
    state.videos = state.videos.filter((v)=>v.id!==item.videoId);
  }
  renderMedia();
}

function renderMedia() {
  let photoNo=0;
  const frameCountByVideo = new Map();
  const videoIndex = new Map(state.videos.map((v,i)=>[v.id,i+1]));
  els.photoGrid.innerHTML = state.media.map((item,index) => {
    let badge='';
    if (item.sourceType==='videoFrame') {
      const n=(frameCountByVideo.get(item.videoId)||0)+1; frameCountByVideo.set(item.videoId,n);
      badge=`VIDEO ${videoIndex.get(item.videoId)||1} • F${n}`;
    } else { photoNo++; badge=`PHOTO ${photoNo}`; }
    return `<div class="media-item"><img src="${item.dataUrl}" alt="${escapeHtml(badge)}"><span class="media-badge">${badge}</span><button class="media-remove" data-remove-media="${index}" type="button">×</button></div>`;
  }).join('');
  els.photoGrid.querySelectorAll('[data-remove-media]').forEach((btn)=>btn.addEventListener('click',()=>removeMedia(Number(btn.dataset.removeMedia))));
  const photoCount=state.media.filter((m)=>m.sourceType==='photo').length;
  if (!photoCount && !state.videos.length) { els.mediaSummary.classList.add('hidden'); els.mediaSummary.textContent=''; return; }
  els.mediaSummary.classList.remove('hidden');
  const bits=[]; if(photoCount) bits.push(`${photoCount} photo${photoCount===1?'':'s'}`); if(state.videos.length) bits.push(`${state.videos.length} video${state.videos.length===1?'':'s'}`);
  els.mediaSummary.textContent=`✓ ${bits.join(' • ')} ready for Pal to review`;
}

function directorInstruction() {
  const detail = els.detailLevel.value;
  const format = currentFormatLabel();
  const existingOnly = state.planStyle === 'existing';
  const depthRule = detail === 'detailed'
    ? 'Be unusually specific. The user wants to be able to follow each step without guessing.'
    : detail === 'quick'
      ? 'Keep the plan concise and checklist-like, but still include timing and camera action.'
      : 'Give practical, clear step-by-step directions.';
  const formatRule = state.format === 'photo'
    ? 'This is a PHOTO POST. Use the reelPlan array as a still-photo shot list. Every step must say STILL PHOTO, exact angle/framing, orientation, what should be in frame, and whether to leave negative space for text. Do not tell the user to record video unless it is clearly optional.'
    : state.format === 'story'
      ? 'This is a STORY. Use reelPlan as a frame-by-frame Story capture plan. Say whether each frame should be a still or video, how long any video should be held, and what text should appear.'
      : state.format === 'campaign'
        ? 'This is a FULL CONTENT PLAN. Use reelPlan as a practical capture list that can supply a feed post, Story and short Reel from one shoot. Mix stills and short video only when useful.'
        : 'This is a REEL / SHORT VIDEO. Build a watchable 12–20 second plan unless the brief asks for another length.';
  const sourceRule = existingOnly
    ? 'WORK WITH WHAT I HAVE: Build the production/edit plan only from the uploaded assets. Do not ask for any additional shots. Explain exactly how to use the existing photos/videos.'
    : 'PLAN A NEW SHOOT: You may use uploaded media as references, but tell the user exactly what new stills or video clips to capture when that would improve the idea.';
  return [
    'SOCIAL MEDIA PAL DIRECTOR MODE. You are a hands-on content director, not an automatic video editor.',
    `Requested format: ${format}.`,
    formatRule,
    sourceRule,
    depthRule,
    'The reelPlan array is the PRIMARY PRODUCTION PLAN. Create 4–8 ordered steps unless the brief clearly needs fewer.',
    'For EVERY reelPlan step, the detail must explicitly include: (1) STILL PHOTO or VIDEO CLIP, (2) vertical/horizontal orientation when relevant, (3) framing/angle and approximate distance, (4) exactly what the camera or subject should do, (5) how long to record or hold the shot, (6) if video, whether to keep the camera still, pan left/right, tilt, or slowly move closer/away, and (7) how much of that shot to use in the finished piece.',
    'Do not use vague advice like “get a close-up.” Give practical directions such as “Record vertically for 4 seconds, phone 12–18 inches away, hold still for 1 second, then slowly move closer; use about 2.5 seconds.”',
    'Use plain everyday language. Avoid unexplained filmmaking jargon. Do not recommend digital pinch-zoom while recording; prefer physically moving closer or cropping later when appropriate.',
    'Each overlayText must be the literal short on-screen wording to add for that step, or “No overlay needed.”',
    'The reelHook should be the creative opening/hook. The headline should name the overall concept.',
    'The caption, alternate, hashtags, Story copy, CTA and overlay fields should be copy-ready publishing material.',
    state.media.length ? 'Review the uploaded media in visualNotes: identify what is useful, what to skip or improve, and keep references accurate to Photo N / Video N.' : 'No existing media was uploaded. Do not pretend to have seen any.',
    isGeneralMode() ? 'GENERAL / TEST MODE: Do not mention Ocean State Spice & Tea Merchants, Wayland Square, Providence, shopping, a store, local-business hashtags, or a purchase/visit CTA unless the user explicitly mentions those things in this project.' : ''
  ].filter(Boolean).join('\n');
}

function buildDescription() {
  const brief = els.description.value.trim();
  return `${directorInstruction()}\n\nPROJECT BRIEF:\n${brief || 'Choose a strong, practical concept based on the selected format and any uploaded media.'}`;
}

function profileForMode() { return isGeneralMode() ? generalProfile : getProfile(); }

function buildPayload(action='generate', refineInstruction='') {
  const videoFrames=state.media.filter((m)=>m.sourceType==='videoFrame');
  return {
    action,
    oneTap: action==='generate',
    description: buildDescription(),
    contentMode: state.contentMode,
    contentType: currentFormatLabel(),
    tone: els.tone.value,
    options: {
      reel: true,
      story: state.format==='story' || state.format==='campaign',
      visual: state.media.length>0,
      hashtags: true,
      reelMode: state.planStyle==='existing' ? 'uploaded_only' : 'extra_shots_ok'
    },
    profile: profileForMode(),
    images: state.media.map((m)=>m.dataUrl),
    mediaManifest: state.media.map((m,index)=>({imageNumber:index+1,sourceType:m.sourceType,name:m.name||'',videoName:m.videoName||'',videoId:m.videoId||'',videoTime:Number.isFinite(m.videoTime)?Number(m.videoTime.toFixed(2)):null})),
    videoContext: state.videos[0] ? {...state.videos[0],frameTimes:videoFrames.filter((m)=>m.videoId===state.videos[0].id).map((m)=>Number(m.videoTime||0).toFixed(1))} : null,
    videoContexts: state.videos.map((v)=>({...v,frameTimes:videoFrames.filter((m)=>m.videoId===v.id).map((m)=>Number(m.videoTime||0).toFixed(1))})),
    currentResult: action==='refine' ? state.result : undefined,
    refineInstruction: action==='refine' ? refineInstruction : undefined
  };
}

async function requestPlan(action='generate', refineInstruction='') {
  if (state.loading) return;
  if (!state.authReady) { showToast('Connecting…'); return; }
  if (!state.user) { showAuthNotice('Sign in with Google first, then build your plan.'); await signIn(); return; }
  if (state.planStyle==='existing' && !state.media.length) { showToast('Add media first, or choose Plan a new shoot'); return; }
  state.loading=true;
  const original=els.buildPlanBtn.innerHTML;
  els.buildPlanBtn.disabled=true;
  els.buildPlanBtn.innerHTML='<span>✨ Pal is directing…</span><b>•••</b>';
  els.refineBtns.forEach((b)=>b.disabled=true);
  try {
    const response=await generateSocialPackage(buildPayload(action,refineInstruction));
    const result=response?.data?.result;
    if(!result) throw new Error('No content plan was returned.');
    state.result=result;
    state.shootIndex=0;
    state.completedShots=new Set();
    renderPlanDialog();
    renderShootMode();
    renderPublishKit();
    saveProject();
    if(!els.planDialog.open) els.planDialog.showModal();
  } catch(error) {
    console.error(error);
    const code=String(error?.code||'');
    if(code.includes('unauthenticated')) showAuthNotice('Your sign-in expired. Sign in again and retry.');
    else if(code.includes('resource-exhausted')) showAuthNotice('The content limit was reached. Try again a little later.');
    else showAuthNotice(error?.message || 'Pal could not build the plan.');
  } finally {
    state.loading=false;
    els.buildPlanBtn.disabled=false;
    els.buildPlanBtn.innerHTML=original;
    els.refineBtns.forEach((b)=>b.disabled=false);
  }
}

function shotList() {
  return Array.isArray(state.result?.reelPlan) ? state.result.reelPlan.filter((s)=>s && (s.title||s.detail)) : [];
}

function extractDurationSeconds(text) {
  const s=String(text||'');
  let match=s.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  if(match) return Math.max(Number(match[1]),Number(match[2]));
  match=s.match(/(?:for|about|around|roughly|hold|record|film|show|use)\s+(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  if(match) return Number(match[1]);
  match=s.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?)\b/i);
  if(match) return Number(match[1]);
  return state.format==='photo' ? 0 : 4;
}

function shotMetadata(shot) {
  const text=`${shot?.title||''} ${shot?.detail||''}`.toLowerCase();
  let type='Video';
  if(/still photo|photo|still image/.test(text) && !/video/.test(text)) type='Still';
  if(state.format==='photo') type='Still';
  let movement='Hold steady';
  if(/pan left/.test(text)) movement='Pan left';
  else if(/pan right/.test(text)) movement='Pan right';
  else if(/move closer|slowly closer|push in/.test(text)) movement='Move closer';
  else if(/move away|slowly away|pull back/.test(text)) movement='Move away';
  else if(/tilt up/.test(text)) movement='Tilt up';
  else if(/tilt down/.test(text)) movement='Tilt down';
  else if(/zoom/.test(text)) movement='Zoom/crop';
  const duration=extractDurationSeconds(text);
  const orientation=/horizontal|landscape/.test(text)?'Horizontal':/vertical|portrait|9:16/.test(text)?'Vertical':(state.format==='reel'||state.format==='story'?'Vertical':'');
  return {type,movement,duration,orientation};
}

function renderShotChips(shot) {
  const meta=shotMetadata(shot);
  const chips=[meta.type];
  if(meta.orientation) chips.push(meta.orientation);
  if(meta.duration>0) chips.push(`${meta.duration % 1 ? meta.duration.toFixed(1):meta.duration}s`);
  if(meta.type==='Video') chips.push(meta.movement);
  return chips.map((x)=>`<span class="shot-chip">${escapeHtml(x)}</span>`).join('');
}

function conceptSummaryText() {
  const parts=[];
  if(state.result?.reelHook) parts.push(state.result.reelHook);
  if(state.result?.postOverlayText && state.result.postOverlayText!==state.result.reelHook) parts.push(`Suggested cover text: “${state.result.postOverlayText}”`);
  return parts.join(' ');
}

function renderPlanDialog() {
  if(!state.result) return;
  els.resultHeadline.textContent=state.result.headline || 'Your content plan';
  els.conceptHook.textContent=state.result.reelHook || state.result.headline || 'A clear creative direction';
  els.conceptSummary.textContent=conceptSummaryText() || 'Pal mapped out a practical sequence you can follow shot by shot.';
  if(state.result.leadImage) { els.leadAsset.textContent=`Best starting asset: ${state.result.leadImage}`; els.leadAsset.classList.remove('hidden'); } else els.leadAsset.classList.add('hidden');
  const shots=shotList();
  els.shotPlanList.innerHTML=shots.length ? shots.map((shot,index)=>`<article class="plan-shot"><div class="plan-shot-top"><span class="plan-shot-number">${index+1}</span><div><h4>${escapeHtml(shot.title || `Shot ${index+1}`)}</h4><p>${escapeHtml(shot.detail||'')}</p><div class="shot-chips">${renderShotChips(shot)}</div></div></div><div class="plan-overlay"><strong>ON-SCREEN TEXT:</strong> ${escapeHtml(shot.overlayText || 'No overlay needed')}</div></article>`).join('') : '<p>No shot list was returned. Try “More detailed.”</p>';
  const notes=Array.isArray(state.result.visualNotes)?state.result.visualNotes.filter((n)=>n?.title||n?.detail):[];
  els.mediaReviewSection.classList.toggle('hidden',!notes.length);
  els.mediaReviewList.innerHTML=notes.map((note)=>`<div class="review-item"><strong>${escapeHtml(note.title||'Media note')}</strong><p>${escapeHtml(note.detail||'')}</p></div>`).join('');
  renderAssemblyPlan();
}

function renderAssemblyPlan() {
  const shots=shotList();
  const format=state.format;
  const intro=format==='photo'
    ? 'Choose the strongest hero photo first. Use the remaining planned stills for a carousel only if they add something different.'
    : format==='story'
      ? 'Build the Story in this exact order. Keep text readable and let each frame finish before advancing.'
      : format==='campaign'
        ? 'Capture everything first, then pull the best still for the feed post and the strongest moving moments for the Reel/Story.'
        : 'Place the clips in this exact order. Trim away the dead space before and after each action. Use clean hard cuts by default; use a soft dissolve only when the concept is calm.';
  const steps=[intro];
  shots.forEach((shot,index)=>{
    const meta=shotMetadata(shot);
    const length=meta.duration>0 ? ` Keep roughly ${meta.duration % 1 ? meta.duration.toFixed(1):meta.duration} seconds in the working cut.` : '';
    steps.push(`Step ${index+1}: ${shot.title || `Shot ${index+1}`}.${length} ${shot.overlayText && !/no overlay/i.test(shot.overlayText) ? `Add “${shot.overlayText}” as the on-screen text.` : 'No on-screen text needed.'}`);
  });
  if(format!=='photo') steps.push('Watch the full sequence once with the sound off. If a cut feels rushed, lengthen the shot before it rather than adding a flashy transition.');
  els.assemblyPlan.innerHTML=steps.map((text,index)=>`<div class="assembly-step"><span>${index+1}</span><div>${escapeHtml(text)}</div></div>`).join('');
}

function renderShootMode() {
  const shots=shotList();
  const has=Boolean(state.result && shots.length);
  els.shootEmpty.classList.toggle('hidden',has);
  els.shootState.classList.toggle('hidden',!has);
  if(!has) return;
  state.shootIndex=Math.max(0,Math.min(state.shootIndex,shots.length-1));
  const shot=shots[state.shootIndex];
  const meta=shotMetadata(shot);
  els.shootProgressText.textContent=`Shot ${state.shootIndex+1} of ${shots.length} • ${state.completedShots.size} done`;
  els.shootProgressBar.style.width=`${((state.shootIndex+1)/shots.length)*100}%`;
  els.shootStepBadge.textContent=String(state.shootIndex+1);
  els.shootChips.innerHTML=renderShotChips(shot);
  els.shootTitle.textContent=shot.title || `Shot ${state.shootIndex+1}`;
  els.shootDetail.textContent=shot.detail || '';
  els.shootOverlay.textContent=shot.overlayText || 'No overlay needed';
  const done=state.completedShots.has(state.shootIndex);
  els.markShotBtn.classList.toggle('completed',done);
  els.markShotBtn.textContent=done?'✓ Done':'✓ Mark done';
  els.prevShotBtn.disabled=state.shootIndex===0;
  els.nextShotBtn.textContent=state.shootIndex===shots.length-1?'Finish ✓':'Next →';
  stopShotTimer();
  els.timerDisplay.textContent=meta.duration>0?`${meta.duration % 1 ? meta.duration.toFixed(1):meta.duration}s shot`:'Still photo';
  els.timerBtn.disabled=meta.duration<=0;
  els.timerBtn.textContent=meta.duration>0?'▶ Start timer':'No timer needed';
  els.shotChecklist.innerHTML=shots.map((s,i)=>`<button class="check-item ${state.completedShots.has(i)?'done':''}" data-shot-index="${i}" type="button"><span>${state.completedShots.has(i)?'✓':i+1}</span><div><strong>${escapeHtml(s.title||`Shot ${i+1}`)}</strong></div></button>`).join('');
  els.shotChecklist.querySelectorAll('[data-shot-index]').forEach((btn)=>btn.addEventListener('click',()=>{state.shootIndex=Number(btn.dataset.shotIndex);renderShootMode();}));
}

function stopShotTimer() {
  if(state.timer) clearInterval(state.timer);
  state.timer=null; state.timerEnd=0;
}

function startShotTimer() {
  const shot=shotList()[state.shootIndex];
  if(!shot) return;
  const duration=shotMetadata(shot).duration;
  if(duration<=0) return;
  stopShotTimer();
  state.timerEnd=Date.now()+duration*1000;
  els.timerBtn.textContent='■ Stop';
  const tick=()=>{
    const remaining=Math.max(0,state.timerEnd-Date.now());
    els.timerDisplay.textContent=remaining>0?`${(remaining/1000).toFixed(1)}s`:'CUT ✓';
    if(remaining<=0){stopShotTimer();els.timerBtn.textContent='▶ Again';if(navigator.vibrate) navigator.vibrate([80,60,80]);}
  };
  tick(); state.timer=setInterval(tick,100);
}

function toggleShotTimer() {
  if(state.timer){stopShotTimer();renderShootMode();} else startShotTimer();
}

function changeShot(delta) {
  const shots=shotList(); if(!shots.length) return;
  if(delta>0 && state.shootIndex===shots.length-1){showToast('Shoot complete — check your list');return;}
  state.shootIndex=Math.max(0,Math.min(shots.length-1,state.shootIndex+delta)); renderShootMode();
}

function toggleShotDone() {
  const idx=state.shootIndex;
  if(state.completedShots.has(idx)) state.completedShots.delete(idx); else state.completedShots.add(idx);
  renderShootMode();
}

function renderPublishKit() {
  const has=Boolean(state.result);
  els.publishEmpty.classList.toggle('hidden',has);
  els.publishState.classList.toggle('hidden',!has);
  if(!has) return;
  const cards=[];
  const add=(title,text)=>{if(String(text||'').trim())cards.push({title,text:String(text).trim()});};
  add('Primary caption',state.result.caption);
  add('Short caption',state.result.alternate);
  add('Cover / post text',state.result.postOverlayText);
  add('Reel hook',state.result.reelHook);
  add('Story copy',state.result.story);
  add('Story text',state.result.storyOverlayText);
  add('Call to action',state.result.cta);
  els.publishCards.innerHTML=cards.map((card,index)=>`<article class="publish-card"><div class="publish-card-head"><h3>${escapeHtml(card.title)}</h3><button class="copy-btn" data-copy-card="${index}" type="button">Copy</button></div><p>${escapeHtml(card.text)}</p></article>`).join('') + (Array.isArray(state.result.hashtags)&&state.result.hashtags.length?`<article class="publish-card"><div class="publish-card-head"><h3>Hashtags</h3><button class="copy-btn" data-copy-tags type="button">Copy</button></div><div class="hashtag-wrap">${state.result.hashtags.map((tag)=>`<span>${escapeHtml(tag)}</span>`).join('')}</div></article>`:'');
  els.publishCards.querySelectorAll('[data-copy-card]').forEach((btn)=>btn.addEventListener('click',()=>copyText(cards[Number(btn.dataset.copyCard)].text,'Copied')));
  els.publishCards.querySelector('[data-copy-tags]')?.addEventListener('click',()=>copyText(state.result.hashtags.join(' '),'Hashtags copied'));
}

async function copyText(text,message='Copied') {
  try { await navigator.clipboard.writeText(text); showToast(message); }
  catch { const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast(message); }
}

function fullPlanText() {
  if(!state.result) return '';
  const lines=[`SOCIAL MEDIA PAL — ${currentFormatLabel().toUpperCase()}`,state.result.headline||'', '',`IDEA: ${state.result.reelHook||''}`,'','SHOT PLAN'];
  shotList().forEach((s,i)=>{lines.push(`${i+1}. ${s.title||`Shot ${i+1}`}`,s.detail||'',`On-screen text: ${s.overlayText||'No overlay needed'}`,'');});
  lines.push('ASSEMBLY');
  [...els.assemblyPlan.querySelectorAll('.assembly-step div')].forEach((node)=>lines.push(`• ${node.textContent}`));
  if(state.result.caption) lines.push('','CAPTION',state.result.caption);
  if(state.result.alternate) lines.push('','SHORT CAPTION',state.result.alternate);
  if(state.result.hashtags?.length) lines.push('','HASHTAGS',state.result.hashtags.join(' '));
  return lines.join('\n');
}

function loadProjects() {
  try { state.projects=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]'); if(!Array.isArray(state.projects))state.projects=[]; } catch { state.projects=[]; }
}

function saveProjects() { localStorage.setItem(PROJECTS_KEY,JSON.stringify(state.projects.slice(0,MAX_PROJECTS))); }

function saveProject() {
  if(!state.result) return;
  const brief=els.description.value.trim();
  const project={id:makeId('plan'),savedAt:Date.now(),contentMode:state.contentMode,format:state.format,planStyle:state.planStyle,tone:els.tone.value,detailLevel:els.detailLevel.value,brief,result:state.result};
  state.projects=[project,...state.projects].slice(0,MAX_PROJECTS); saveProjects(); renderProjects();
}

function renderProjects() {
  const items=state.projects;
  els.projectsEmpty.classList.toggle('hidden',items.length>0);
  els.projectsList.innerHTML=items.map((p,index)=>`<article class="project-card"><div><h3>${escapeHtml(p.result?.headline||'Content plan')}</h3><p>${escapeHtml(({reel:'Reel',photo:'Photo post',story:'Story',campaign:'Full plan'})[p.format]||'Plan')} • ${p.contentMode==='general'?'General/Test':'Business'} • ${new Date(p.savedAt).toLocaleDateString()}</p></div><div class="project-actions"><button data-open-project="${index}" type="button">Open</button><button class="danger" data-delete-project="${index}" type="button">Delete</button></div></article>`).join('');
  els.projectsList.querySelectorAll('[data-open-project]').forEach((btn)=>btn.addEventListener('click',()=>openProject(Number(btn.dataset.openProject))));
  els.projectsList.querySelectorAll('[data-delete-project]').forEach((btn)=>btn.addEventListener('click',()=>deleteProject(Number(btn.dataset.deleteProject))));
}

function openProject(index) {
  const p=state.projects[index]; if(!p)return;
  state.contentMode=p.contentMode==='general'?'general':'business'; state.format=p.format||'reel'; state.planStyle=p.planStyle||'new'; state.result=p.result||null; state.shootIndex=0; state.completedShots=new Set();
  els.description.value=p.brief||''; els.tone.value=p.tone||els.tone.value; els.detailLevel.value=p.detailLevel||'detailed';
  localStorage.setItem(CONTENT_MODE_KEY,state.contentMode); renderContentMode();renderFormat();renderPlanStyle();renderPlanDialog();renderShootMode();renderPublishKit();activateView('plan'); els.planDialog.showModal();
}

function deleteProject(index) { state.projects.splice(index,1);saveProjects();renderProjects();showToast('Plan deleted'); }

function clearProjects() { if(!state.projects.length)return; if(confirm('Delete all saved content plans?')){state.projects=[];saveProjects();renderProjects();showToast('Saved plans cleared');} }

function refineInstruction(kind) {
  const map={
    another:'Create a genuinely different creative concept and a new shot sequence. Keep the same facts and format, but change the hook, visual approach and shot order. Keep the director-style detail.',
    detail:'Make the production plan substantially more specific. Every shot must clearly state still vs video, orientation, framing, approximate phone distance, movement, exact recording/hold duration, usable edit duration, and literal overlay text.',
    simple:'Simplify this into the easiest practical version possible. Use fewer shots, minimal equipment, simple camera movements, and keep it realistic for one person filming with a phone.',
    fun:'Make the concept noticeably more playful and energetic while staying natural. Change the hook and shot choices, not just the wording.'
  };
  return map[kind]||map.another;
}

async function handleRefine(kind) {
  if(!state.result){showToast('Build a plan first');return;}
  await requestPlan('refine',refineInstruction(kind));
}

function setVoiceStatus(text) { els.voiceStatus.textContent=text; }
function setMicMeter(level=0){els.micLevelBar.style.width=`${Math.max(0,Math.min(100,Math.round(level*100)))}%`;}
function micCandidates(mode='auto'){if(mode==='mono'||mode==='stereo')return[mode];const preferred=state.lastWorkingMicMode&&state.lastWorkingMicMode!=='auto'?[state.lastWorkingMicMode]:[];return[...new Set([...preferred,'default','stereo','mono'])];}
function micConstraints(candidate='default'){const supported=navigator.mediaDevices?.getSupportedConstraints?.()||{};const audio={echoCancellation:true,noiseSuppression:true,autoGainControl:true};if(supported.channelCount&&candidate==='mono')audio.channelCount={ideal:1};if(supported.channelCount&&candidate==='stereo')audio.channelCount={ideal:2};return{audio,video:false};}
async function openMic(candidate){return navigator.mediaDevices.getUserMedia(micConstraints(candidate));}
function stopMicTest(){if(micTestStream)micTestStream.getTracks().forEach(t=>t.stop());micTestStream=null;if(micAudioContext){try{micAudioContext.close();}catch{}}micAudioContext=null;setMicMeter(0);}
async function measureMic(stream,durationMs=1600){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return .02;micAudioContext=new Ctx();try{await micAudioContext.resume();}catch{}const analyser=micAudioContext.createAnalyser();analyser.fftSize=1024;const source=micAudioContext.createMediaStreamSource(stream);source.connect(analyser);const data=new Float32Array(analyser.fftSize);let peak=0,started=performance.now();await new Promise(resolve=>{const tick=(now)=>{analyser.getFloatTimeDomainData(data);let sum=0;for(const v of data)sum+=v*v;const rms=Math.sqrt(sum/data.length);peak=Math.max(peak,rms);setMicMeter(Math.min(1,rms*9));if(now-started<durationMs)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});try{source.disconnect();}catch{}return peak;}
async function testMicrophone(){if(!navigator.mediaDevices?.getUserMedia){setVoiceStatus('Microphone access is not supported here.');return;}stopMicTest();els.testMicBtn.disabled=true;els.testMicBtn.textContent='Testing…';setVoiceStatus('Speak normally for a moment…');const selected=els.micMode.value||'auto';try{for(const candidate of micCandidates(selected)){let stream=null;try{stream=await openMic(candidate);micTestStream=stream;const peak=await measureMic(stream);if(peak>.006){state.lastWorkingMicMode=candidate;setVoiceStatus(`Microphone working • ${candidate==='default'?'Auto/default':candidate}`);showToast('Microphone test passed');return;}}catch(error){console.info(error);}finally{if(stream)stream.getTracks().forEach(t=>t.stop());micTestStream=null;if(micAudioContext){try{await micAudioContext.close();}catch{}micAudioContext=null;}setMicMeter(0);}}setVoiceStatus('Mic opened but I did not detect your voice. Try Stereo or Mono.');}finally{stopMicTest();els.testMicBtn.disabled=false;els.testMicBtn.textContent='Test microphone';}}
async function prepareSpeechMic(){const selected=els.micMode.value||'auto';let lastError=null;for(const candidate of micCandidates(selected)){let stream=null;try{stream=await openMic(candidate);state.lastWorkingMicMode=candidate;stream.getTracks().forEach(t=>t.stop());return candidate;}catch(error){lastError=error;if(stream)stream.getTracks().forEach(t=>t.stop());}}throw lastError||new Error('Microphone could not open');}
function speechCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
function updateVoiceButton(listening){state.voiceListening=listening;els.tellPalBtn.classList.toggle('listening',listening);els.tellPalBtn.innerHTML=listening?'<span>■</span><span><strong>Stop listening</strong><small>Tap when finished</small></span>':'<span>🎙️</span><span><strong>Tell Pal</strong><small>Speak instead of typing</small></span>';}
async function startTellPal(){if(state.voiceListening&&speechRecognition){try{speechRecognition.stop();}catch{}return;}const Ctor=speechCtor();if(!Ctor){setVoiceStatus('Speech-to-text is not available here. You can still use the keyboard microphone.');return;}setVoiceStatus('Checking microphone…');try{await prepareSpeechMic();}catch{setVoiceStatus('Microphone could not open. Try Mic settings → Stereo, then test it.');return;}const rec=new Ctor();speechRecognition=rec;rec.lang='en-US';rec.continuous=true;rec.interimResults=true;voiceBaseText=els.description.value.trim();voiceTranscript='';rec.onstart=()=>{updateVoiceButton(true);setVoiceStatus('Listening… tell Pal what you want to create.');};rec.onresult=(event)=>{let heard='';for(let i=0;i<event.results.length;i++)heard+=`${event.results[i][0]?.transcript||''} `;voiceTranscript=heard.trim();els.description.value=[voiceBaseText,voiceTranscript].filter(Boolean).join(voiceBaseText&&voiceTranscript?' ':'');setVoiceStatus(voiceTranscript?'Listening… I’m hearing you.':'Listening…');};rec.onerror=(event)=>{const map={'not-allowed':'Microphone permission was denied.','audio-capture':'No usable microphone audio was found. Try Stereo.','no-speech':'I did not hear speech. Try again.','network':'Speech recognition could not connect.'};setVoiceStatus(map[event.error]||'Tell Pal stopped listening.');};rec.onend=()=>{updateVoiceButton(false);speechRecognition=null;if(voiceTranscript){setVoiceStatus('Added to your brief. Edit it if you want, then build the plan.');showToast('Voice brief added');}else setVoiceStatus('Ready when you are.');};try{rec.start();}catch{updateVoiceButton(false);speechRecognition=null;setVoiceStatus('Tell Pal could not start.');}}

// Events
els.authBtn.addEventListener('click',handleAuth);
els.profileBtn.addEventListener('click',()=>els.profileDialog.showModal());
els.saveProfileBtn.addEventListener('click',saveProfile);
els.contentModeBtns.forEach((btn)=>btn.addEventListener('click',()=>setContentMode(btn.dataset.contentMode)));
els.formatBtns.forEach((btn)=>btn.addEventListener('click',()=>{state.format=btn.dataset.format||'reel';renderFormat();}));
els.planStyleBtns.forEach((btn)=>btn.addEventListener('click',()=>{state.planStyle=btn.dataset.planStyle||'new';renderPlanStyle();}));
els.starterBtns.forEach((btn)=>btn.addEventListener('click',()=>{els.description.value=btn.dataset.starter||'';els.description.focus();showToast('Idea added — edit it or build the plan');}));
els.photoInput.addEventListener('change',(e)=>addFiles([...e.target.files]));
els.videoInput.addEventListener('change',(e)=>addFiles([...e.target.files]));
els.buildPlanBtn.addEventListener('click',()=>requestPlan('generate'));
els.closePlanBtn.addEventListener('click',()=>els.planDialog.close());
els.startShootModeBtn.addEventListener('click',()=>{els.planDialog.close();activateView('shoot');});
els.exitShootBtn.addEventListener('click',()=>{activateView('plan');renderPlanDialog();els.planDialog.showModal();});
els.goPublishBtn.addEventListener('click',()=>{els.planDialog.close();activateView('publish');});
els.copyPlanBtn.addEventListener('click',()=>copyText(fullPlanText(),'Full plan copied'));
els.refineBtns.forEach((btn)=>btn.addEventListener('click',()=>handleRefine(btn.dataset.refine)));
els.prevShotBtn.addEventListener('click',()=>changeShot(-1));
els.nextShotBtn.addEventListener('click',()=>changeShot(1));
els.markShotBtn.addEventListener('click',toggleShotDone);
els.timerBtn.addEventListener('click',toggleShotTimer);
els.navBtns.forEach((btn)=>btn.addEventListener('click',()=>activateView(btn.dataset.viewTarget)));
els.goBtns.forEach((btn)=>btn.addEventListener('click',()=>activateView(btn.dataset.go)));
els.clearProjectsBtn.addEventListener('click',clearProjects);
els.tellPalBtn.addEventListener('click',startTellPal);
els.testMicBtn.addEventListener('click',testMicrophone);
els.micMode.addEventListener('change',()=>{localStorage.setItem(MIC_MODE_KEY,els.micMode.value);state.lastWorkingMicMode='';setVoiceStatus(`${els.micMode.options[els.micMode.selectedIndex].text} selected.`);});

function init(){
  loadProfile(); loadContentMode(); loadProjects(); renderProjects(); renderFormat(); renderPlanStyle(); renderMedia(); renderShootMode(); renderPublishKit();
  const savedMic=localStorage.getItem(MIC_MODE_KEY); if(['auto','mono','stereo'].includes(savedMic))els.micMode.value=savedMic;
  initFirebase();
}

init();
