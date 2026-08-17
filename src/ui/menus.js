import { state, getElapsedSeconds } from '../state.js';
import { t, getLang, setLang } from '../i18n/translations.js';
import { setScoreState, updateScoreText, renderTimer } from './hud.js';
import {
  initAudio,
  toggleMute as toggleAudioMute,
  getIsMuted,
  pauseTransport,
  resumeTransport,
  playWinJingle,
} from '../audio/synths.js';
import { saveScoreToCloud } from '../net/leaderboard.js';

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const startBtn = document.getElementById('start-btn');
const timerContainer = document.getElementById('timer-container');
const nameInputContainer = document.getElementById('name-input-container');
const nameInput = document.getElementById('player-name-input');
const leaderboardSection = document.getElementById('leaderboard-section');
const leaderboardTitleEl = document.getElementById('leaderboard-title');
const pauseBtn = document.getElementById('pause-btn');
const pauseOverlay = document.getElementById('pause-overlay');
const pauseTitleEl = document.getElementById('pause-title');
const resumeBtn = document.getElementById('resume-btn');

let activePlayer = null;
let activeLevel = null;

function renderOverlayContent() {
  if (state.overlayMode === 'win') {
    overlayTitle.innerHTML = t('win_title');
    overlayDesc.innerHTML = t('win_desc')
      .replace('{TIME}', state.finalTime.toFixed(2))
      .replace('{N}', activeLevel.totalMilks);
    startBtn.innerText = t('play_again');
  } else {
    overlayTitle.innerHTML = t('menu_title');
    overlayDesc.innerHTML = t('menu_desc').replace('{N}', activeLevel.totalMilks);
    startBtn.innerText = t('play');
  }
}

function updateAudioButtons() {
  const isMuted = getIsMuted();
  document.querySelectorAll('.audio-toggle-btn').forEach((btn) => {
    btn.innerText = isMuted ? t('sound_off') : t('sound_on');
    btn.classList.toggle('bg-red-500/80', isMuted);
    btn.classList.toggle('hover:bg-red-400', isMuted);
    btn.classList.toggle('bg-blue-500/80', !isMuted);
    btn.classList.toggle('hover:bg-blue-400', !isMuted);
  });
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const active = btn.dataset.lang === getLang();
    btn.classList.toggle('bg-[#22c55e]', active);
    btn.classList.toggle('shadow-[2px_2px_0_rgba(0,0,0,0.4)]', active);
  });
}

function applyLanguage() {
  document.title = t('doc_title');
  document.documentElement.lang = getLang();
  renderOverlayContent();
  nameInput.placeholder = t('name_placeholder');
  leaderboardTitleEl.innerText = t('leaderboard_title');
  const loadingEl = document.getElementById('leaderboard-loading-msg');
  if (loadingEl) loadingEl.innerText = t('leaderboard_loading');
  updateScoreText(activeLevel);
  updateAudioButtons();
  updateLangButtons();
  pauseTitleEl.innerText = t('pause_title');
  resumeBtn.innerText = t('resume');
  if (state.gameState === 'PLAYING' || state.gameState === 'PAUSED') renderTimer(getElapsedSeconds());
}

function handleSetLanguage(newLang) {
  if (getLang() === newLang) return;
  setLang(newLang);
  applyLanguage();
}

function handleToggleMute() {
  toggleAudioMute();
  updateAudioButtons();
}

export function pauseGame() {
  if (state.gameState !== 'PLAYING') return;
  state.gameState = 'PAUSED';
  state.pauseStartedAt = Date.now();
  pauseTransport();
  pauseOverlay.classList.remove('hidden');
}

export function resumeGame() {
  if (state.gameState !== 'PAUSED') return;
  state.totalPausedMs += Date.now() - state.pauseStartedAt;
  state.gameState = 'PLAYING';
  resumeTransport();
  pauseOverlay.classList.add('hidden');
}

export function togglePause() {
  if (state.gameState === 'PLAYING') pauseGame();
  else if (state.gameState === 'PAUSED') resumeGame();
}

export async function startGame() {
  nameInput.blur();
  window.scrollTo(0, 0);
  if (!state.playerName) state.playerName = t('anon_prefix') + Math.floor(Math.random() * 1000);
  await initAudio();
  activeLevel.generateLevel();
  activePlayer.reset();
  state.camera.x = 0;
  state.totalPausedMs = 0;
  setScoreState('normal', activeLevel);
  timerContainer.classList.remove('hidden');
  renderTimer(0);
  overlay.classList.add('opacity-0');
  setTimeout(() => {
    overlay.classList.add('hidden');
    nameInputContainer.classList.add('hidden');
    leaderboardSection.classList.add('hidden');
    state.startTime = Date.now();
    state.gameState = 'PLAYING';
    pauseBtn.classList.remove('hidden');
  }, 300);
}

// Called once, the frame the player touches the flagpole with all milks collected.
export function triggerEnding() {
  state.gameState = 'ENDING';
  pauseBtn.classList.add('hidden');
  state.finalTime = getElapsedSeconds();
  renderTimer(state.finalTime, 2);
  playWinJingle();
}

export function gameWin() {
  state.gameState = 'WIN';
  saveScoreToCloud(state.playerName, state.finalTime);

  timerContainer.classList.add('hidden');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.remove('opacity-0');
    state.overlayMode = 'win';
    renderOverlayContent();
    leaderboardSection.classList.remove('hidden');
  }, 50);
}

export function initMenus(player, level) {
  activePlayer = player;
  activeLevel = level;

  nameInput.addEventListener('input', (e) => {
    state.playerName = e.target.value.trim();
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startGame();
    }
  });

  startBtn.addEventListener('click', startGame);
  resumeBtn.addEventListener('click', resumeGame);
  pauseBtn.addEventListener('click', togglePause);
  document
    .querySelectorAll('.audio-toggle-btn')
    .forEach((btn) => btn.addEventListener('click', handleToggleMute));
  document
    .querySelectorAll('.lang-btn')
    .forEach((btn) => btn.addEventListener('click', () => handleSetLanguage(btn.dataset.lang)));

  applyLanguage();
}
