import { useRef, useState, useCallback, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import WaveformCanvas from '../components/music/WaveformCanvas';
import TimeInput from '../components/music/TimeInput';
import {
  Upload, Play, Pause, SkipBack, SkipForward,
  Repeat, Volume2, Gauge, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────
function secToDisplay(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ds = Math.floor((sec % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ds}`;
}

const SPEED_STEPS = [0.25, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

type WaveMode = 'seek' | 'setStart' | 'setEnd';

// ─── Main page ─────────────────────────────────────────────────
export default function MusicPage() {
  const player = useAudioPlayer();
  const { state } = player;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [waveMode, setWaveMode] = useState<WaveMode>('seek');
  const [isDragOver, setIsDragOver] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space')       { e.preventDefault(); player.togglePlay(); }
      if (e.code === 'ArrowLeft')   player.skip(e.shiftKey ? -10 : -5);
      if (e.code === 'ArrowRight')  player.skip(e.shiftKey ? 10 : 5);
      if (e.code === 'KeyI')        player.setLoopStart(state.currentTime);
      if (e.code === 'KeyO')        player.setLoopEnd(state.currentTime);
      if (e.code === 'KeyL')        player.setLoopEnabled(!state.loopEnabled);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [player, state.currentTime, state.loopEnabled]);

  // ── file loading ──────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i)) return;
    await player.loadFile(file);
  }, [player]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── speed ─────────────────────────────────────────────────
  const speedIndex = SPEED_STEPS.findIndex(s => Math.abs(s - state.speed) < 0.001);
  const adjSpeed = (dir: -1 | 1) => {
    const i = speedIndex < 0 ? SPEED_STEPS.indexOf(1.0) : speedIndex;
    const next = SPEED_STEPS[Math.max(0, Math.min(SPEED_STEPS.length - 1, i + dir))];
    if (next !== undefined) player.setSpeed(next);
  };

  // ── progress bar click ────────────────────────────────────
  const progressRef = useRef<HTMLDivElement>(null);
  const handleProgressClick = (e: React.MouseEvent) => {
    const el = progressRef.current;
    if (!el || state.duration === 0) return;
    const rect = el.getBoundingClientRect();
    player.seek(((e.clientX - rect.left) / rect.width) * state.duration);
  };

  const progress = state.duration > 0 ? state.currentTime / state.duration : 0;
  const loopStartPct = state.duration > 0 ? (state.loop.start / state.duration) * 100 : 0;
  const loopEndPct   = state.duration > 0 ? (state.loop.end   / state.duration) * 100 : 100;

  // ── UI states ─────────────────────────────────────────────
  if (!state.isLoaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full max-w-md flex flex-col items-center justify-center gap-4 cursor-pointer
            rounded-md border-2 border-dashed transition-all py-16 px-8
            ${isDragOver
              ? 'border-[#FF4D00] bg-[#FF4D00]/10'
              : 'border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/6'
            }
          `}
        >
          <div className={`w-16 h-16 rounded-md flex items-center justify-center transition-all ${
            isDragOver ? 'bg-[#FF4D00]/20' : 'bg-white/8'
          }`}>
            <Upload size={28} className={isDragOver ? 'text-[#FF4D00]' : 'text-white/40'} />
          </div>
          <div className="text-center">
            <p className="text-white/70 font-medium text-sm">音楽ファイルをドロップ</p>
            <p className="text-white/30 text-xs mt-1">またはクリックして選択</p>
            <p className="text-white/18 text-[10px] mt-2">MP3 · WAV · AAC · OGG · FLAC 対応</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileInput} className="hidden" />

        {/* Keyboard hints */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-white/20">読み込んだ後のキーボード操作</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-white/25">
            <span>スペース = 再生/停止</span>
            <span>← → = ±5秒</span>
            <span>I = ループ開始点</span>
            <span>O = ループ終了点</span>
            <span>L = ループON/OFF</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0A0A0C]">

      {/* ── File header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{state.fileName}</p>
          <p className="text-[10px] text-white/30">{secToDisplay(state.duration)} 全体</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-xs transition-all border border-white/8"
        >
          <Upload size={12} />
          別のファイル
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileInput} className="hidden" />
      </div>

      {/* ── Waveform ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        {/* Mode selector */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">波形操作</span>
          <div className="flex gap-1">
            {([
              { mode: 'seek'     as WaveMode, label: 'シーク',        shortcut: '' },
              { mode: 'setStart' as WaveMode, label: 'IN点 (I)',      shortcut: 'I' },
              { mode: 'setEnd'   as WaveMode, label: 'OUT点 (O)',     shortcut: 'O' },
            ]).map(m => (
              <button
                key={m.mode}
                onClick={() => setWaveMode(m.mode)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all border ${
                  waveMode === m.mode
                    ? m.mode === 'seek'
                      ? 'bg-white/15 border-white/25 text-white'
                      : m.mode === 'setStart'
                        ? 'bg-[#FF4D00]/20 border-[#FF4D00]/50 text-[#FF4D00]'
                        : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-white/4 border-white/8 text-white/35 hover:bg-white/8'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {state.waveformData && (
          <WaveformCanvas
            waveformData={state.waveformData}
            duration={state.duration}
            currentTime={state.currentTime}
            loopStart={state.loop.start}
            loopEnd={state.loop.end}
            loopEnabled={state.loopEnabled}
            mode={waveMode}
            onSeek={player.seek}
            onSetLoopStart={player.setLoopStart}
            onSetLoopEnd={player.setLoopEnd}
          />
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div className="px-4 py-1 shrink-0">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="relative h-1.5 rounded-sm cursor-pointer overflow-visible"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          {/* Loop region */}
          <div
            className="absolute top-0 bottom-0 rounded-sm opacity-40"
            style={{
              left: `${loopStartPct}%`,
              width: `${loopEndPct - loopStartPct}%`,
              background: state.loopEnabled ? '#FF4D00' : 'rgba(255,255,255,0.3)',
            }}
          />
          {/* Played */}
          <div
            className="absolute top-0 left-0 bottom-0 rounded-sm bg-white/70"
            style={{ width: `${progress * 100}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-sm bg-white transition-none"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
        {/* Time display */}
        <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-mono">
          <span>{secToDisplay(state.currentTime)}</span>
          <span>-{secToDisplay(state.duration - state.currentTime)}</span>
        </div>
      </div>

      {/* ── Transport controls ───────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 py-4 shrink-0">
        {/* Skip -10s */}
        <button
          onClick={() => player.skip(-10)}
          className="flex flex-col items-center gap-0.5 text-white/40 hover:text-white transition-colors"
        >
          <SkipBack size={20} />
          <span className="text-[9px]">−10s</span>
        </button>

        {/* Skip -5s */}
        <button
          onClick={() => player.skip(-5)}
          className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={22} />
          <span className="text-[9px]">−5s</span>
        </button>

        {/* Play/Pause */}
        <button
          onClick={player.togglePlay}
          className={`w-16 h-16 rounded-sm flex items-center justify-center text-white transition-all  ${
            state.isPlaying
              ? 'bg-white/15 hover:bg-white/20 border border-white/20'
              : 'bg-[#FF4D00] hover:bg-[#E04500]'
          }`}
        >
          {state.isPlaying
            ? <Pause size={24} fill="white" />
            : <Play  size={24} fill="white" className="ml-1" />
          }
        </button>

        {/* Skip +5s */}
        <button
          onClick={() => player.skip(5)}
          className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors"
        >
          <ChevronRight size={22} />
          <span className="text-[9px]">+5s</span>
        </button>

        {/* Skip +10s */}
        <button
          onClick={() => player.skip(10)}
          className="flex flex-col items-center gap-0.5 text-white/40 hover:text-white transition-colors"
        >
          <SkipForward size={20} />
          <span className="text-[9px]">+10s</span>
        </button>
      </div>

      {/* ── Loop point controls ──────────────────────────────── */}
      <div className="px-4 py-3 border-t border-white/5 shrink-0">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {/* Loop toggle */}
          <button
            onClick={() => player.setLoopEnabled(!state.loopEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all border ${
              state.loopEnabled
                ? 'bg-[#FF4D00]/20 border-[#FF4D00]/40 text-[#FF4D00]'
                : 'bg-white/5 border-white/8 text-white/35 hover:bg-white/10'
            }`}
          >
            <Repeat size={13} />
            ループ
          </button>

          {/* IN / OUT time editors */}
          <div className="flex-1 flex items-center justify-center gap-6">
            <TimeInput
              value={state.loop.start}
              max={state.loop.end - 0.1}
              onChange={player.setLoopStart}
              label="IN 開始"
              color="#FF4D00"
            />

            {/* Visual connector */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <div className="w-6 h-px" style={{ background: 'linear-gradient(to right, #FF4D00, rgba(100,150,255,0.8))' }} />
                <span className="text-[9px] text-white/20 font-mono">
                  {secToDisplay(state.loop.end - state.loop.start)}
                </span>
                <div className="w-6 h-px" style={{ background: 'linear-gradient(to right, rgba(100,150,255,0.8), #6496ff)' }} />
              </div>
              <span className="text-[9px] text-white/20">ループ区間</span>
            </div>

            <TimeInput
              value={state.loop.end}
              max={state.duration}
              onChange={player.setLoopEnd}
              label="OUT 終了"
              color="#6496ff"
            />
          </div>

          {/* Reset loop */}
          <button
            onClick={player.resetLoop}
            title="ループ区間をリセット"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/12 text-white/30 hover:text-white transition-all border border-white/8"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Set from current position */}
        <div className="flex justify-center gap-3 mt-2.5">
          <button
            onClick={() => player.setLoopStart(state.currentTime)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-[#FF4D00]/70 hover:text-[#FF4D00] text-[11px] transition-all border border-[#FF4D00]/15"
          >
            現在位置をIN (I)
          </button>
          <button
            onClick={() => player.setLoopEnd(state.currentTime)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/70 hover:text-blue-300 text-[11px] transition-all border border-blue-500/15"
          >
            現在位置をOUT (O)
          </button>
        </div>
      </div>

      {/* ── Speed & Volume ───────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/5 bg-[#0F0F12]/70 shrink-0">
        <div className="max-w-lg mx-auto space-y-3">

          {/* Speed */}
          <div className="flex items-center gap-3">
            <Gauge size={14} className="text-white/30 shrink-0" />
            <span className="text-[10px] text-white/30 w-8 shrink-0">速度</span>
            <button onClick={() => adjSpeed(-1)} disabled={speedIndex <= 0}
              className="w-7 h-7 rounded-sm bg-white/8 hover:bg-white/15 text-white/50 hover:text-white text-sm font-bold transition-all disabled:opacity-25">
              −
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max={SPEED_STEPS.length - 1}
                step="1"
                value={Math.max(0, speedIndex)}
                onChange={e => player.setSpeed(SPEED_STEPS[Number(e.target.value)])}
                className="w-full"
                style={{ accentColor: '#FF4D00' }}
              />
              {/* Speed markers */}
              <div className="flex justify-between text-[8px] text-white/15 mt-0.5 px-0.5">
                {SPEED_STEPS.filter((_, i) => i % 3 === 0 || _ === 1.0).map(s => (
                  <span key={s} className={s === 1.0 ? 'text-white/35' : ''}>{s}×</span>
                ))}
              </div>
            </div>
            <button onClick={() => adjSpeed(1)} disabled={speedIndex >= SPEED_STEPS.length - 1}
              className="w-7 h-7 rounded-sm bg-white/8 hover:bg-white/15 text-white/50 hover:text-white text-sm font-bold transition-all disabled:opacity-25">
              ＋
            </button>
            <span
              className="text-sm font-bold w-12 text-right tabular-nums"
              style={{ color: state.speed === 1.0 ? 'rgba(255,255,255,0.5)' : '#FF4D00' }}
            >
              {state.speed.toFixed(2)}×
            </span>
          </div>

          {/* Speed quick buttons */}
          <div className="flex gap-1.5 justify-center">
            {[0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.0, 1.25, 1.5].map(s => (
              <button
                key={s}
                onClick={() => player.setSpeed(s)}
                className={`px-2 py-1 rounded-sm text-[11px] font-medium transition-all border ${
                  Math.abs(state.speed - s) < 0.001
                    ? 'bg-[#FF4D00]/20 border-[#FF4D00]/45 text-[#FF4D00]'
                    : 'bg-white/4 border-white/8 text-white/30 hover:bg-white/8 hover:text-white/60'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <Volume2 size={14} className="text-white/30 shrink-0" />
            <span className="text-[10px] text-white/30 w-8 shrink-0">音量</span>
            <input
              type="range" min="0" max="1" step="0.02"
              value={state.volume}
              onChange={e => player.setVolume(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#FF4D00' }}
            />
            <span className="text-xs text-white/30 w-8 text-right">{Math.round(state.volume * 100)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
