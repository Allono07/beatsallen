import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { config } from '/config.js';

const $ = (selector) => document.querySelector(selector);
const path = '/music/kepler-186f/';
const dialog = $('#search-dialog');
const audio = $('#audio');
const player = $('#player');
const playerToggle = $('#player-toggle');
const seek = $('#seek');
const volume = $('#volume');
const currentTimeEl = $('#current-time');
const durationEl = $('#duration');
const controllerToggle = $('#controller-toggle');
const controllerSeek = $('#controller-seek');
const controllerVolume = $('#controller-volume');
const controllerCurrent = $('#controller-current');
const controllerDuration = $('#controller-duration');
const likeButton = $('#like');
const dislikeButton = $('#dislike');

let db = null;
let reactionState = { like: false, dislike: false };

function setReactionButtonsEnabled(enabled) {
  if (likeButton) likeButton.disabled = !enabled;
  if (dislikeButton) dislikeButton.disabled = !enabled;
}

function updateReactionButtons() {
  if (likeButton) {
    likeButton.setAttribute('aria-pressed', reactionState.like ? 'true' : 'false');
  }
  if (dislikeButton) {
    dislikeButton.setAttribute('aria-pressed', reactionState.dislike ? 'true' : 'false');
  }
}

async function initReactions() {
  const firebaseConfig = config?.firebase;
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    setReactionButtonsEnabled(false);
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    const reactionDoc = doc(db, 'music', 'kepler-186f');
    const snapshot = await getDoc(reactionDoc);
    const data = snapshot.exists() ? snapshot.data() : {};

    reactionState = {
      like: Boolean(data.userVote === 'like'),
      dislike: Boolean(data.userVote === 'dislike'),
    };

    const enableButtons = Boolean(firebaseConfig.projectId);
    setReactionButtonsEnabled(enableButtons);
    updateReactionButtons();

    likeButton?.addEventListener('click', async () => {
      if (!db) return;
      const ref = doc(db, 'music', 'kepler-186f');
      const nextVote = reactionState.like ? 'none' : 'like';
      const current = (await getDoc(ref)).exists() ? (await getDoc(ref)).data() : {};
      const likes = Number(current.likes || 0);
      const dislikes = Number(current.dislikes || 0);
      const nextData = {
        likes: reactionState.like ? Math.max(0, likes - 1) : likes + 1,
        dislikes: reactionState.dislike ? Math.max(0, dislikes - 1) : dislikes,
        userVote: nextVote,
      };
      await setDoc(ref, nextData, { merge: true });
      reactionState = {
        like: nextVote === 'like',
        dislike: nextVote === 'dislike',
      };
      updateReactionButtons();
    });

    dislikeButton?.addEventListener('click', async () => {
      if (!db) return;
      const ref = doc(db, 'music', 'kepler-186f');
      const nextVote = reactionState.dislike ? 'none' : 'dislike';
      const current = (await getDoc(ref)).exists() ? (await getDoc(ref)).data() : {};
      const likes = Number(current.likes || 0);
      const dislikes = Number(current.dislikes || 0);
      const nextData = {
        likes: reactionState.like ? Math.max(0, likes - 1) : likes,
        dislikes: reactionState.dislike ? Math.max(0, dislikes - 1) : dislikes + 1,
        userVote: nextVote,
      };
      await setDoc(ref, nextData, { merge: true });
      reactionState = {
        like: nextVote === 'like',
        dislike: nextVote === 'dislike',
      };
      updateReactionButtons();
    });
  } catch (error) {
    console.warn('Firebase reactions unavailable:', error);
    setReactionButtonsEnabled(false);
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function setPlayerVisible(visible) {
  if (!player) return;
  player.hidden = !visible;
  document.body.classList.toggle('has-player', visible);
}

function syncPlayerState() {
  if (!audio) return;
  const isPlaying = !audio.paused;
  const toggleButtons = [playerToggle, controllerToggle].filter(Boolean);
  toggleButtons.forEach((button) => {
    button.textContent = isPlaying ? '❚❚' : '▷';
    button.setAttribute('aria-label', isPlaying ? 'Pause track' : 'Play track');
  });
}

function initMusicController() {
  if (!audio) return;

  const sources = [playerToggle, controllerToggle].filter(Boolean);
  const controls = [seek, controllerSeek, volume, controllerVolume].filter(Boolean);

  const volumeValue = Number((volume || controllerVolume)?.value || 0.8);
  audio.volume = Number.isFinite(volumeValue) ? volumeValue : 0.8;

  sources.forEach((button) => {
    button.addEventListener('click', () => {
      setPlayerVisible(true);
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  });

  controls.forEach((control) => {
    if (!control) return;
    control.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      if (control === seek || control === controllerSeek) {
        audio.currentTime = value;
      }
      if (control === volume || control === controllerVolume) {
        audio.volume = value;
      }
    });
  });

  audio.addEventListener('loadedmetadata', () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
    if (controllerDuration) controllerDuration.textContent = formatTime(audio.duration);
    if (seek) {
      seek.max = String(Math.floor(audio.duration || 0));
      seek.disabled = !Number.isFinite(audio.duration);
    }
    if (controllerSeek) {
      controllerSeek.max = String(Math.floor(audio.duration || 0));
      controllerSeek.disabled = !Number.isFinite(audio.duration);
    }
    setPlayerVisible(true);
  });

  audio.addEventListener('timeupdate', () => {
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (controllerCurrent) controllerCurrent.textContent = formatTime(audio.currentTime);
    if (seek) seek.value = String(Math.floor(audio.currentTime || 0));
    if (controllerSeek) controllerSeek.value = String(Math.floor(audio.currentTime || 0));
  });

  audio.addEventListener('play', syncPlayerState);
  audio.addEventListener('pause', syncPlayerState);
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    syncPlayerState();
  });

  const initialVolume = Number((volume || controllerVolume)?.value || 0.8);
  if (Number.isFinite(initialVolume)) {
    audio.volume = initialVolume;
  }

  if (!audio.src && audio.getAttribute('src')) {
    audio.load();
  }
}

function renderRoute() {
  const current = window.location.pathname.replace(/\/$/, '') || '/';
  const isSongRoute = current === '/music/kepler-186f';
  $('#home-view').hidden = current !== '/';
  $('#song-view').hidden = !isSongRoute;
  $('#not-found-view').hidden = current === '/' || isSongRoute;
  document.title = isSongRoute ? 'Journey to Kepler 186F — Afterlife Theory Labs' : 'Afterlife Theory Labs — Sound beyond the familiar';
  if (player) {
    const showPlayer = isSongRoute;
    player.hidden = !showPlayer;
    document.body.classList.toggle('has-player', showPlayer);
  }
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-route]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  history.pushState({}, '', link.getAttribute('href'));
  dialog.close(); renderRoute(); window.scrollTo(0, 0); $('#main').focus({ preventScroll: true });
});
window.addEventListener('popstate', renderRoute);
$('.search-trigger').addEventListener('click', () => { dialog.showModal(); $('#search-input').focus(); });
$('#close-search').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
document.addEventListener('keydown', event => { if(event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !event.ctrlKey && !event.metaKey) { event.preventDefault(); if(!dialog.open) dialog.showModal(); $('#search-input').focus(); } });
function search() {
  const query = $('#search-input').value.trim().toLowerCase();
  const matches = query.split(/\s+/).every(word => 'journey to kepler 186f afterlife theory labs space journey planet travel'.includes(word));
  $('#search-results').innerHTML = matches ? `<a href="${path}" data-route class="release-row"><img src="/assets/kepler.webp" alt="" width="74" height="58"><span class="release-name">Journey to Kepler 186F<small>Afterlife Theory Labs · Experiment 001</small></span></a>` : '<p class="empty-result">No tracks found.<br>Try “Kepler” or “Afterlife”.</p>';
}
$('#search-input').addEventListener('input', search); search();
$('#year').textContent = new Date().getFullYear();
const scene = $('.observatory');
if (scene) {
  scene.addEventListener('pointermove', event => { const r=scene.getBoundingClientRect(); scene.style.setProperty('--mx',`${((event.clientX-r.left)/r.width-.5)*35}px`); scene.style.setProperty('--my',`${((event.clientY-r.top)/r.height-.5)*25}px`); });
  scene.addEventListener('pointerleave', () => {scene.style.setProperty('--mx','0px');scene.style.setProperty('--my','0px');});
  function drawStars() { const canvas=$('#stars'),ctx=canvas.getContext('2d');if(!ctx)return;const ratio=Math.min(devicePixelRatio,2);const r=canvas.getBoundingClientRect();canvas.width=r.width*ratio;canvas.height=r.height*ratio;ctx.scale(ratio,ratio);let seed=138;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let i=0;i<100;i++){ctx.fillStyle=`rgba(226,225,201,${.15+rand()*.6})`;ctx.beginPath();ctx.arc(rand()*r.width,rand()*r.height,rand()*.85+.25,0,Math.PI*2);ctx.fill();} }
  new ResizeObserver(drawStars).observe(scene);
  let signalPosition=.5;
  function drawSignal() {
    const canvas=$('#signal'),ctx=canvas.getContext('2d'); if(!ctx)return;
    const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,2);canvas.width=r.width*ratio;canvas.height=r.height*ratio;ctx.scale(ratio,ratio);
    for(let line=0;line<39;line++){
      ctx.beginPath();ctx.strokeStyle=`rgba(60,76,42,${.25+line/65})`;ctx.lineWidth=.85;
      for(let x=0;x<=r.width;x+=2){const nx=x/r.width;const envelope=Math.exp(-Math.pow((nx-.5)*3.9,2));const wave=Math.sin(nx*(17+signalPosition*10)+line*.145)*envelope;const y=r.height*.5+wave*r.height*.17+(line-19)*3.1*Math.sin(nx*Math.PI);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    }
    $('#signal-frequency').textContent=(120+signalPosition*132).toFixed(2);
  }
  new ResizeObserver(drawSignal).observe(scene);
  scene.addEventListener('pointermove',event=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=scene.getBoundingClientRect();signalPosition=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));drawSignal();});
}
initReactions();
initMusicController();
renderRoute();
