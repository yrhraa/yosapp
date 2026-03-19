import { useRef, useState, useCallback, useEffect } from 'react';

export interface LoopPoint {
  start: number;  // seconds
  end: number;    // seconds
}

export interface AudioPlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number;   // seconds (visual, updated via rAF)
  duration: number;      // seconds
  loop: LoopPoint;
  speed: number;         // 0.5 ~ 2.0
  volume: number;        // 0.0 ~ 1.0
  loopEnabled: boolean;
  fileName: string;
  waveformData: Float32Array | null;  // downsampled peaks for drawing
}

const INITIAL_STATE: AudioPlayerState = {
  isLoaded: false,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  loop: { start: 0, end: 0 },
  speed: 1.0,
  volume: 1.0,
  loopEnabled: true,
  fileName: '',
  waveformData: null,
};

const WAVEFORM_SAMPLES = 1000;

function buildWaveform(buffer: AudioBuffer): Float32Array {
  const raw = buffer.getChannelData(0);
  const blockSize = Math.floor(raw.length / WAVEFORM_SAMPLES);
  const peaks = new Float32Array(WAVEFORM_SAMPLES);
  for (let i = 0; i < WAVEFORM_SAMPLES; i++) {
    let max = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      const v = Math.abs(raw[start + j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const ctxRef      = useRef<AudioContext | null>(null);
  const bufferRef   = useRef<AudioBuffer | null>(null);
  const sourceRef   = useRef<AudioBufferSourceNode | null>(null);
  const gainRef     = useRef<GainNode | null>(null);
  const startedAtRef  = useRef(0);   // ctx.currentTime when playback started
  const startOffsetRef = useRef(0);  // audio offset when playback started (seconds)
  const rafRef      = useRef<number>(0);
  const loopCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── ensure AudioContext ──────────────────────────────────────
  const ensureCtx = useCallback(async () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.connect(ctxRef.current.destination);
      gainRef.current.gain.value = stateRef.current.volume;
    }
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ── rAF: update currentTime display ─────────────────────────
  const startRaf = useCallback(() => {
    const tick = () => {
      const ctx = ctxRef.current;
      if (!ctx || !stateRef.current.isPlaying) return;
      const elapsed = (ctx.currentTime - startedAtRef.current) * stateRef.current.speed;
      const ct = Math.min(startOffsetRef.current + elapsed, stateRef.current.duration);
      setState(s => ({ ...s, currentTime: ct }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRaf = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── loop monitor: restart at loopStart when loopEnd reached ─
  const startLoopMonitor = useCallback(() => {
    if (loopCheckRef.current) clearInterval(loopCheckRef.current);
    loopCheckRef.current = setInterval(() => {
      const { isPlaying, loop, loopEnabled, speed, duration } = stateRef.current;
      if (!isPlaying || !loopEnabled) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      const elapsed = (ctx.currentTime - startedAtRef.current) * speed;
      const ct = startOffsetRef.current + elapsed;
      const loopEnd = loop.end > 0 ? loop.end : duration;
      if (ct >= loopEnd - 0.05) {
        // restart from loop.start
        _playFrom(loop.start);
      }
    }, 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopLoopMonitor = useCallback(() => {
    if (loopCheckRef.current) { clearInterval(loopCheckRef.current); loopCheckRef.current = null; }
  }, []);

  // ── internal: start source from offset ──────────────────────
  const _playFrom = useCallback((offsetSec: number) => {
    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    const gain = gainRef.current;
    if (!ctx || !buffer || !gain) return;

    // stop current source
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (_) {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = stateRef.current.speed;
    src.connect(gain);

    const safeOffset = Math.max(0, Math.min(offsetSec, buffer.duration - 0.01));
    src.start(0, safeOffset);
    sourceRef.current = src;
    startedAtRef.current  = ctx.currentTime;
    startOffsetRef.current = safeOffset;

    setState(s => ({ ...s, isPlaying: true, currentTime: safeOffset }));
  }, []);

  // ── load file ──────────────────────────────────────────────
  const loadFile = useCallback(async (file: File) => {
    const ctx = await ensureCtx();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    bufferRef.current = buffer;

    const waveformData = buildWaveform(buffer);
    const duration = buffer.duration;

    setState({
      ...INITIAL_STATE,
      isLoaded: true,
      duration,
      loop: { start: 0, end: duration },
      waveformData,
      fileName: file.name,
      volume: stateRef.current.volume,
      speed: stateRef.current.speed,
    });
  }, [ensureCtx]);

  // ── play ───────────────────────────────────────────────────
  const play = useCallback(async () => {
    if (!bufferRef.current) return;
    await ensureCtx();
    const { currentTime, loop } = stateRef.current;

    // If past loopEnd, start from loopStart
    const loopEnd = loop.end > 0 ? loop.end : stateRef.current.duration;
    const startFrom = currentTime >= loopEnd ? loop.start : currentTime;

    _playFrom(startFrom);
    startRaf();
    startLoopMonitor();
  }, [ensureCtx, _playFrom, startRaf, startLoopMonitor]);

  // ── pause ──────────────────────────────────────────────────
  const pause = useCallback(() => {
    stopRaf();
    stopLoopMonitor();
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (_) {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    // Capture current position
    const ctx = ctxRef.current;
    if (ctx) {
      const elapsed = (ctx.currentTime - startedAtRef.current) * stateRef.current.speed;
      const ct = Math.min(startOffsetRef.current + elapsed, stateRef.current.duration);
      setState(s => ({ ...s, isPlaying: false, currentTime: ct }));
    } else {
      setState(s => ({ ...s, isPlaying: false }));
    }
  }, [stopRaf, stopLoopMonitor]);

  const togglePlay = useCallback(() => {
    if (stateRef.current.isPlaying) pause();
    else play();
  }, [play, pause]);

  // ── seek ───────────────────────────────────────────────────
  const seek = useCallback((sec: number) => {
    const clamped = Math.max(0, Math.min(sec, stateRef.current.duration));
    if (stateRef.current.isPlaying) {
      _playFrom(clamped);
      startLoopMonitor();
    } else {
      startOffsetRef.current = clamped;
      setState(s => ({ ...s, currentTime: clamped }));
    }
  }, [_playFrom, startLoopMonitor]);

  // ── loop points ────────────────────────────────────────────
  const setLoopStart = useCallback((sec: number) => {
    const s = stateRef.current;
    const clamped = Math.max(0, Math.min(sec, s.loop.end - 0.1));
    setState(prev => ({ ...prev, loop: { ...prev.loop, start: clamped } }));
  }, []);

  const setLoopEnd = useCallback((sec: number) => {
    const s = stateRef.current;
    const clamped = Math.max(s.loop.start + 0.1, Math.min(sec, s.duration));
    setState(prev => ({ ...prev, loop: { ...prev.loop, end: clamped } }));
  }, []);

  const setLoopEnabled = useCallback((v: boolean) => {
    setState(s => ({ ...s, loopEnabled: v }));
    if (!v) stopLoopMonitor();
    else if (stateRef.current.isPlaying) startLoopMonitor();
  }, [stopLoopMonitor, startLoopMonitor]);

  const resetLoop = useCallback(() => {
    setState(s => ({ ...s, loop: { start: 0, end: s.duration } }));
  }, []);

  // ── speed ──────────────────────────────────────────────────
  const setSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.25, Math.min(2.0, speed));
    setState(s => ({ ...s, speed: clamped }));
    // Apply to active source
    if (sourceRef.current) {
      sourceRef.current.playbackRate.value = clamped;
      // Recalculate startedAt so elapsed-time calc stays accurate after speed change
      const ctx = ctxRef.current;
      if (ctx) {
        const oldElapsed = (ctx.currentTime - startedAtRef.current) * stateRef.current.speed;
        startOffsetRef.current = startOffsetRef.current + oldElapsed;
        startedAtRef.current = ctx.currentTime;
      }
    }
  }, []);

  // ── volume ─────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setState(s => ({ ...s, volume: clamped }));
    if (gainRef.current) gainRef.current.gain.value = clamped;
  }, []);

  // ── skip ───────────────────────────────────────────────────
  const skip = useCallback((deltaSec: number) => {
    seek(stateRef.current.currentTime + deltaSec);
  }, [seek]);

  // cleanup
  useEffect(() => {
    return () => {
      stopRaf();
      stopLoopMonitor();
      ctxRef.current?.close();
    };
  }, [stopRaf, stopLoopMonitor]);

  return {
    state,
    loadFile,
    togglePlay,
    play,
    pause,
    seek,
    skip,
    setLoopStart,
    setLoopEnd,
    setLoopEnabled,
    resetLoop,
    setSpeed,
    setVolume,
  };
}
