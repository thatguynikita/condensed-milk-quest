import * as Tone from 'tone';
import { AUDIO, STORAGE_KEYS } from '../config.js';

let initialized = false;
let isMuted = localStorage.getItem(STORAGE_KEYS.muted) === 'true';

let melodySynth, bassSynth, meowSynth, slurpNoise, slurpFilter;
let lastSlurpTime = 0;

export function isAudioInitialized() {
  return initialized;
}

export function getIsMuted() {
  return isMuted;
}

export async function initAudio() {
  if (initialized) {
    Tone.Transport.start();
    return;
  }
  await Tone.start();
  initialized = true;
  Tone.Transport.bpm.value = AUDIO.bpm;

  melodySynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 },
  }).toDestination();
  melodySynth.volume.value = AUDIO.melodyVolume;

  bassSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.8 },
  }).toDestination();
  bassSynth.volume.value = AUDIO.bassVolume;

  meowSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.4 },
  }).toDestination();
  meowSynth.volume.value = AUDIO.meowVolume;

  slurpFilter = new Tone.Filter(300, 'lowpass').toDestination();
  slurpNoise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
  }).connect(slurpFilter);
  slurpNoise.volume.value = AUDIO.slurpVolume;

  const melody = [
    { time: '0:0', note: 'C5', dur: '8n' },
    { time: '0:0.5', note: 'E5', dur: '8n' },
    { time: '0:1', note: 'G5', dur: '8n' },
    { time: '0:1.5', note: 'C6', dur: '8n' },
    { time: '0:2', note: 'G5', dur: '4n' },
    { time: '0:3', note: 'E5', dur: '4n' },
    { time: '1:0', note: 'F5', dur: '8n' },
    { time: '1:0.5', note: 'A5', dur: '8n' },
    { time: '1:1', note: 'C6', dur: '8n' },
    { time: '1:1.5', note: 'F6', dur: '8n' },
    { time: '1:2', note: 'C6', dur: '4n' },
    { time: '1:3', note: 'A5', dur: '4n' },
  ];
  const bass = [
    { time: '0:0', note: 'C3', dur: '4n' },
    { time: '0:1', note: 'G3', dur: '4n' },
    { time: '0:2', note: 'C3', dur: '4n' },
    { time: '0:3', note: 'G3', dur: '4n' },
    { time: '1:0', note: 'F2', dur: '4n' },
    { time: '1:1', note: 'C3', dur: '4n' },
    { time: '1:2', note: 'F2', dur: '4n' },
    { time: '1:3', note: 'C3', dur: '4n' },
  ];

  const melPart = new Tone.Part((time, value) => {
    melodySynth.triggerAttackRelease(value.note, value.dur, time);
  }, melody).start(0);
  melPart.loop = true;
  melPart.loopEnd = '2m';
  const bPart = new Tone.Part((time, value) => {
    bassSynth.triggerAttackRelease(value.note, value.dur, time);
  }, bass).start(0);
  bPart.loop = true;
  bPart.loopEnd = '2m';

  new Tone.Loop((time) => {
    if (Math.random() > AUDIO.meowTriggerThreshold) triggerMeow(time);
  }, '2m').start('1m');
  Tone.Transport.start();
  Tone.Destination.mute = isMuted;
}

export function triggerMeow(time) {
  if (!meowSynth) return;
  const t = time || Tone.now();
  meowSynth.triggerAttackRelease('G4', '4n', t);
  meowSynth.frequency.rampTo('C5', 0.1, t);
  meowSynth.frequency.rampTo('E4', 0.3, t + 0.1);
}

export function triggerSlurp(time) {
  if (!slurpNoise) return;
  const t = time || Tone.now();
  if (t - lastSlurpTime < AUDIO.slurpMinIntervalSeconds) return;
  lastSlurpTime = t;

  slurpFilter.frequency.cancelScheduledValues(t);
  slurpFilter.frequency.setValueAtTime(300, t);
  slurpFilter.frequency.exponentialRampToValueAtTime(1200, t + 0.03);
  slurpFilter.frequency.exponentialRampToValueAtTime(300, t + 0.1);
  slurpNoise.triggerAttackRelease('32n', t);

  slurpFilter.frequency.setValueAtTime(300, t + 0.12);
  slurpFilter.frequency.exponentialRampToValueAtTime(1500, t + 0.15);
  slurpFilter.frequency.exponentialRampToValueAtTime(300, t + 0.22);
  slurpNoise.triggerAttackRelease('32n', t + 0.12);
}

export function playHitSound() {
  if (!initialized || !meowSynth) return;
  meowSynth.triggerAttackRelease('C3', '8n', Tone.now());
}

export function playStompSound() {
  if (!initialized || !melodySynth) return;
  melodySynth.triggerAttackRelease('C6', '16n', Tone.now());
}

export function playWinJingle() {
  if (!initialized || isMuted) return;
  Tone.Transport.stop();
  melodySynth.triggerAttackRelease('C5', '8n', Tone.now());
  melodySynth.triggerAttackRelease('E5', '8n', Tone.now() + 0.2);
  melodySynth.triggerAttackRelease('G5', '8n', Tone.now() + 0.4);
  melodySynth.triggerAttackRelease('C6', '2n', Tone.now() + 0.6);
}

export function pauseTransport() {
  if (initialized) Tone.Transport.pause();
}

export function resumeTransport() {
  if (initialized) Tone.Transport.start();
}

export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem(STORAGE_KEYS.muted, isMuted);
  if (initialized) Tone.Destination.mute = isMuted;
  return isMuted;
}
