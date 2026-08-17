import { t } from '../i18n/translations.js';
import { state } from '../state.js';

const scoreText = document.getElementById('score-text');
const timerText = document.getElementById('timer-text');

export function setScoreState(newState, level) {
  state.scoreState = newState;
  updateScoreText(level);
}

export function updateScoreText(level) {
  scoreText.classList.remove('text-green-400', 'animate-pulse', 'text-red-400');
  if (state.scoreState === 'ready') {
    scoreText.innerText = t('score_ready');
    scoreText.classList.add('text-green-400', 'animate-pulse');
  } else if (state.scoreState === 'blocked') {
    scoreText.innerText = t('score_blocked').replace('{N}', level.totalMilks);
    scoreText.classList.add('text-red-400');
  } else {
    scoreText.innerText = `${t('score_label')}: ${level.milksCollected} / ${level.totalMilks}`;
  }
}

export function renderTimer(seconds, decimals = 1) {
  timerText.innerText = `${t('time_label')}: ${seconds.toFixed(decimals)}${t('time_unit')}`;
}
