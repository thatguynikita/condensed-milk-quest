import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { t } from '../i18n/translations.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const LEADERBOARD_NAMESPACE = import.meta.env.VITE_LEADERBOARD_NAMESPACE || 'cat-game-nikita';

const leaderboardList = document.getElementById('leaderboard-list');

let leaderboardRef = null;

function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday).getTime();
}

export function initLeaderboard() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    signInAnonymously(auth)
      .then(() => {
        leaderboardRef = collection(db, 'artifacts', LEADERBOARD_NAMESPACE, 'public', 'data', 'leaderboard');

        onSnapshot(
          leaderboardRef,
          (snapshot) => {
            let bestScoresMap = new Map();
            const startOfWeek = getStartOfWeek();

            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.date && data.date >= startOfWeek) {
                const currentRecord = { id: doc.id, ...data };
                const existingRecord = bestScoresMap.get(data.name);
                if (!existingRecord || currentRecord.time < existingRecord.time) {
                  bestScoresMap.set(data.name, currentRecord);
                }
              }
            });

            let scores = Array.from(bestScoresMap.values());
            scores.sort((a, b) => a.time - b.time);
            renderLeaderboardUI(scores.slice(0, 15));
          },
          () => {
            leaderboardList.innerHTML = `<div class="text-center text-red-400 text-xs py-4 pixel-text">${t('leaderboard_error')}</div>`;
          }
        );
      })
      .catch((error) => console.error('Ошибка авторизации:', error));
  } catch (e) {
    console.log('Firebase не инициализирован (проверьте ключи).', e);
  }
}

export async function saveScoreToCloud(name, time) {
  if (!leaderboardRef) return;
  try {
    await addDoc(leaderboardRef, { name: name, time: Number(time), date: Date.now() });
  } catch (e) {
    console.error('Ошибка сохранения рекорда:', e);
  }
}

function renderLeaderboardUI(scores) {
  if (scores.length === 0) {
    leaderboardList.innerHTML = `<div class="text-center text-white/50 py-4 leading-loose">${t('leaderboard_empty')}</div>`;
    return;
  }
  leaderboardList.innerHTML = '';
  scores.forEach((score, index) => {
    const el = document.createElement('div');
    el.className = `flex justify-between items-center p-2 border-2 ${
      index === 0
        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
        : index === 1
          ? 'bg-gray-300/20 border-gray-300 text-gray-200'
          : index === 2
            ? 'bg-orange-600/20 border-orange-500 text-orange-300'
            : 'bg-transparent border-transparent text-white'
    }`;

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2 truncate';
    const rank = document.createElement('span');
    rank.className = 'w-6 text-right';
    rank.textContent = `${index + 1}.`;
    const name = document.createElement('span');
    name.className = 'truncate max-w-[100px] md:max-w-[140px]';
    name.textContent = score.name; // textContent, never innerHTML — score.name is untrusted player input
    left.append(rank, name);

    const time = document.createElement('div');
    time.className = 'bg-black/50 px-2 py-1';
    time.textContent = `${score.time.toFixed(2)}${t('time_unit')}`;

    el.append(left, time);
    leaderboardList.appendChild(el);
  });
}
