import { useRef, useState, useCallback, useEffect } from 'react';

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;   // 1-8, 0 = stopped
  totalBeats: number;    // loop count × 8
  accent: 1 | 2;         // 1 = beat 1 accent, 2 = every beat accented
  volume: number;        // 0.0 - 1.0
  vibrateEnabled: boolean;
  soundType: 'beep' | 'wood' | 'click';
}

// ─── Beep synthesis helpers ────────────────────────────────────────────────
function scheduleBeep(
  ctx: AudioContext,
  time: number,
  isAccent: boolean,
  volume: number,
  soundType: MetronomeState['soundType'],
) {
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);

  if (soundType === 'beep') {
    const osc = ctx.createOscillator();
    osc.connect(gainNode);
    osc.frequency.value = isAccent ? 1760 : 880;
    osc.type = 'sine';
    const dur = 0.04;
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume * 0.8, time + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.start(time);
    osc.stop(time + dur + 0.01);

  } else if (soundType === 'wood') {
    // Wood block: band-pass noise burst
    const bufSize = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = isAccent ? 1400 : 900;
    bp.Q.value = 8;
    src.connect(bp);
    bp.connect(gainNode);
    gainNode.gain.setValueAtTime(volume * (isAccent ? 1.0 : 0.7), time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    src.start(time);
    src.stop(time + 0.06);

  } else {
    // Click: short sine click
    const osc = ctx.createOscillator();
    osc.connect(gainNode);
    osc.frequency.value = isAccent ? 1200 : 600;
    osc.type = 'square';
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume * 0.6, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    osc.start(time);
    osc.stop(time + 0.025);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────
const SCHEDULE_AHEAD = 0.12; // seconds to schedule ahead
const TICK_INTERVAL  = 25;   // ms between scheduler ticks

export function useMetronome(initialBpm = 120) {
  const [state, setState] = useState<MetronomeState>({
    isPlaying: false,
    bpm: initialBpm,
    currentBeat: 0,
    totalBeats: 0,
    accent: 1,
    volume: 0.8,
    vibrateEnabled: true,
    soundType: 'beep',
  });

  const ctxRef        = useRef<AudioContext | null>(null);
  const nextBeatTime  = useRef(0);
  const beatIndex     = useRef(0);   // 0-7
  const tickerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef      = useRef(state);
  stateRef.current    = state;

  // ── scheduler ──────────────────────────────────────────────
  const schedule = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { bpm, volume, accent, soundType, vibrateEnabled } = stateRef.current;
    const secPerBeat = 60 / bpm;

    while (nextBeatTime.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const beat = beatIndex.current; // 0-7
      const isAccent = accent === 2 || beat === 0;
      scheduleBeep(ctx, nextBeatTime.current, isAccent, volume, soundType);

      // Vibration: schedule via setTimeout aligned to audio time
      if (vibrateEnabled && navigator.vibrate) {
        const delay = Math.max(0, (nextBeatTime.current - ctx.currentTime) * 1000);
        const dur = beat === 0 ? 60 : 30;
        setTimeout(() => { try { navigator.vibrate(dur); } catch (_) {} }, delay);
      }

      // UI beat update
      const displayBeat = beat + 1;
      const beatTime = nextBeatTime.current;
      const uiDelay = Math.max(0, (beatTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        setState(s => ({
          ...s,
          currentBeat: displayBeat,
          totalBeats: s.totalBeats + 1,
        }));
      }, uiDelay);

      nextBeatTime.current += secPerBeat;
      beatIndex.current = (beatIndex.current + 1) % 8;
    }

    tickerRef.current = setTimeout(schedule, TICK_INTERVAL);
  }, []);

  // ── start / stop ───────────────────────────────────────────
  const start = useCallback(async () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    beatIndex.current    = 0;
    nextBeatTime.current = ctx.currentTime + 0.05;

    setState(s => ({ ...s, isPlaying: true, currentBeat: 0, totalBeats: 0 }));
    schedule();
  }, [schedule]);

  const stop = useCallback(() => {
    if (tickerRef.current) clearTimeout(tickerRef.current);
    tickerRef.current = null;
    beatIndex.current  = 0;
    setState(s => ({ ...s, isPlaying: false, currentBeat: 0 }));
  }, []);

  const toggle = useCallback(() => {
    if (stateRef.current.isPlaying) stop();
    else start();
  }, [start, stop]);

  // ── setters ────────────────────────────────────────────────
  const setBpm = useCallback((bpm: number) => {
    setState(s => ({ ...s, bpm: Math.max(30, Math.min(240, Math.round(bpm))) }));
  }, []);

  const setVolume = useCallback((v: number) => {
    setState(s => ({ ...s, volume: Math.max(0, Math.min(1, v)) }));
  }, []);

  const setAccent = useCallback((a: 1 | 2) => {
    setState(s => ({ ...s, accent: a }));
  }, []);

  const setSoundType = useCallback((t: MetronomeState['soundType']) => {
    setState(s => ({ ...s, soundType: t }));
  }, []);

  const setVibrateEnabled = useCallback((v: boolean) => {
    setState(s => ({ ...s, vibrateEnabled: v }));
  }, []);

  // ── tap BPM ────────────────────────────────────────────────
  const tapTimesRef = useRef<number[]>([]);
  const tapBpm = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    // Reset if more than 2 seconds since last tap
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = [];
    }
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avg);
      setBpm(newBpm);
    }
  }, [setBpm]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickerRef.current) clearTimeout(tickerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return {
    state,
    toggle,
    start,
    stop,
    setBpm,
    setVolume,
    setAccent,
    setSoundType,
    setVibrateEnabled,
    tapBpm,
  };
}
