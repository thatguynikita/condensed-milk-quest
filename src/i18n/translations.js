import { STORAGE_KEYS } from '../config.js';

const translations = {
  ru: {
    doc_title: 'Котик и Сгущенка',
    menu_title: 'КОТИК И<br>СГУЩЕНКА',
    menu_desc:
      'Собери все {N} баночек как можно быстрее!<br>Остерегайся злых собачек и колючих кактусов.<br><br><b>Управление:</b><br>Стрелочки / WASD - Движение<br>Вверх - Двойной прыжок (прыгай на врагов!)',
    name_placeholder: 'ВВЕДИ НИК',
    leaderboard_title: '🏆 ТОП НЕДЕЛИ 🏆',
    leaderboard_loading: 'Загрузка рекордов...',
    leaderboard_empty: 'Пока нет рекордов.<br>Стань первым!',
    leaderboard_error: 'Ошибка сети',
    play: 'ИГРАТЬ',
    play_again: 'ИГРАТЬ СНОВА',
    anon_prefix: 'Аноним_',
    score_label: 'Сгущенка',
    score_ready: 'БЕГИ К ФЛАГУ!',
    score_blocked: 'НУЖНО {N} БАНОК!',
    time_label: 'Время',
    time_unit: 'с',
    sound_on: '🔊 ЗВУК ВКЛ',
    sound_off: '🔇 ЗВУК ВЫКЛ',
    win_title: 'ПОБЕДА!',
    win_desc:
      'Твое время: <span class="text-[#fde047] text-sm md:text-base">{TIME} сек!</span><br><br>Котик собрал все {N} банок легендарной сгущенки. Теперь он стал восхитительно пухлым, запасов хватит на всю зиму, а пузико полно счастья. Мур-мяу!',
    pause_title: 'ПАУЗА',
    resume: 'ПРОДОЛЖИТЬ',
  },
  en: {
    doc_title: 'Cat and Condensed Milk',
    menu_title: 'CAT &<br>CONDENSED MILK',
    menu_desc:
      'Collect all {N} jars as fast as you can!<br>Watch out for angry doggos and spiky cacti.<br><br><b>Controls:</b><br>Arrows / WASD - Move<br>Up - Double jump (jump on enemies!)',
    name_placeholder: 'ENTER NICK',
    leaderboard_title: '🏆 TOP OF THE WEEK 🏆',
    leaderboard_loading: 'Loading scores...',
    leaderboard_empty: 'No records yet.<br>Be the first!',
    leaderboard_error: 'Network error',
    play: 'PLAY',
    play_again: 'PLAY AGAIN',
    anon_prefix: 'Anon_',
    score_label: 'Milk',
    score_ready: 'RUN TO THE FLAG!',
    score_blocked: 'NEED {N} JARS!',
    time_label: 'Time',
    time_unit: 's',
    sound_on: '🔊 SOUND ON',
    sound_off: '🔇 SOUND OFF',
    win_title: 'VICTORY!',
    win_desc:
      'Your time: <span class="text-[#fde047] text-sm md:text-base">{TIME} sec!</span><br><br>The cat collected all {N} jars of legendary condensed milk. Now perfectly, deliciously round, with enough stashed away for the whole winter and a belly full of happiness. Purr-meow!',
    pause_title: 'PAUSED',
    resume: 'RESUME',
  },
};

export { translations };

// Lazily read localStorage on first use (rather than at module-eval time) so
// simply importing this module has no side effects — matters for both SSR
// safety and for unit-testing `translations` in a plain Node environment.
let lang = null;

function ensureLangLoaded() {
  if (lang === null) lang = localStorage.getItem(STORAGE_KEYS.lang) || 'ru';
}

export function getLang() {
  ensureLangLoaded();
  return lang;
}

export function setLang(newLang) {
  lang = newLang;
  localStorage.setItem(STORAGE_KEYS.lang, lang);
}

export function t(key) {
  ensureLangLoaded();
  return translations[lang][key];
}
