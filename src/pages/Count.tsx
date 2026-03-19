import { useState, useRef, useEffect, useCallback } from 'react';
import { useMetronome } from '../hooks/useMetronome';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

const BPM_PRESETS = [
  { label: 'Slow',   bpm: 72  },
  { label: 'Normal', bpm: 120 },
  { label: 'Fast',   bpm: 144 },
  { label: 'Max',    bpm: 180 },
];

// ─── Beat cell ────────────────────────────────────────────────
function BeatCell({ beat, currentBeat, isPlaying }: {
  beat: number; currentBeat: number; isPlaying: boolean;
}) {
  const isActive = isPlaying && currentBeat === beat;
  const isPast   = isPlaying && currentBeat > beat;
  const isOne    = beat === 1;

  return (
    <div
      className="relative flex flex-col items-center gap-1.5"
      style={{ transition: 'transform 60ms', transform: isActive ? 'scale(1.06)' : 'scale(1)' }}
    >
      <div
        className="flex items-center justify-center font-semibold transition-all"
        style={{
          width:  isOne ? 56 : 44,
          height: isOne ? 56 : 44,
          fontSize: isOne ? 20 : 16,
          borderRadius: 4,
          background: isActive
            ? (isOne ? '#FF4D00' : 'rgba(255,255,255,0.92)')
            : isPast
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.04)',
          color: isActive
            ? (isOne ? '#fff' : '#0A0A0C')
            : isPast ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)',
          border: isActive && !isOne ? 'none' : `1px solid ${
            isActive && isOne ? '#FF4D00'
            : isPast ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.07)'
          }`,
        }}
      >
        {beat}
      </div>
      <div style={{
        width: 4, height: 4, borderRadius: '50%',
        background: isActive ? (isOne ? '#FF4D00' : 'rgba(255,255,255,0.6)') : 'transparent',
        transition: 'background 60ms',
      }}/>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function CountPage() {
  const { state, toggle, setBpm, setVolume, setAccent, setSoundType, setVibrateEnabled, tapBpm } =
    useMetronome(120);

  const [tapFlash, setTapFlash]     = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const bpmDragStart = useRef<{ x: number; bpm: number } | null>(null);

  const handleTap = useCallback(() => {
    tapBpm();
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 80);
  }, [tapBpm]);

  // Horizontal drag for BPM
  const handleBpmMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    bpmDragStart.current = { x: e.clientX, bpm: state.bpm };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!bpmDragStart.current) return;
      setBpm(clamp(bpmDragStart.current.bpm + Math.round((e.clientX - bpmDragStart.current.x) / 3), 30, 240));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging, setBpm]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space')       { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowLeft')   setBpm(state.bpm - (e.shiftKey ? 10 : 1));
      if (e.code === 'ArrowRight')  setBpm(state.bpm + (e.shiftKey ? 10 : 1));
      if (e.code === 'KeyT')        handleTap();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [toggle, setBpm, state.bpm, handleTap]);

  const hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#0A0A0C' }}>

      {/* ── BPM header ─────────────────────────────────── */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6 shrink-0">
        {/* Large draggable BPM number */}
        <div
          className="flex items-end gap-2 select-none"
          style={{ cursor: isDragging ? 'ew-resize' : 'ew-resize' }}
          onMouseDown={handleBpmMouseDown}
        >
          <span
            className="font-semibold tabular-nums leading-none"
            style={{
              fontSize: 88,
              color: isDragging ? '#FF4D00' : 'rgba(255,255,255,0.92)',
              transition: 'color .1s',
              letterSpacing: '-4px',
            }}
          >
            {state.bpm}
          </span>
          <span className="pb-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>BPM</span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>← drag →</p>

        {/* Fine controls */}
        <div className="flex items-center gap-2 mt-5">
          {[-10,-1,1,10].map(d => (
            <button
              key={d}
              onClick={() => setBpm(state.bpm + d)}
              className="font-medium transition-colors"
              style={{
                width: 40, height: 32, borderRadius: 4, fontSize: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {/* Slider */}
        <input
          type="range" min="30" max="240" step="1" value={state.bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="mt-4 w-full max-w-xs"
          style={{ accentColor: '#FF4D00' }}
        />
        <div className="flex justify-between w-full max-w-xs mt-0.5">
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>30</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>240</span>
        </div>

        {/* Presets */}
        <div className="flex gap-1.5 mt-3">
          {BPM_PRESETS.map(p => (
            <button
              key={p.bpm}
              onClick={() => setBpm(p.bpm)}
              style={{
                padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                background: state.bpm === p.bpm ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${state.bpm === p.bpm ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: state.bpm === p.bpm ? '#FF4D00' : 'rgba(255,255,255,0.3)',
                transition: 'all .15s',
              }}
            >
              <span style={{ display: 'block', fontSize: 9, color: state.bpm === p.bpm ? 'rgba(255,77,0,0.6)' : 'rgba(255,255,255,0.18)' }}>
                {p.bpm}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Beat grid ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 min-h-0">
        {/* Progress bar */}
        <div className="w-full max-w-xs h-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full transition-all"
            style={{
              width: state.isPlaying ? `${(state.currentBeat / 8) * 100}%` : '0%',
              background: '#FF4D00',
              transitionDuration: '80ms',
            }}
          />
        </div>

        {/* 4+4 grid */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            {[1,2,3,4].map(b => <BeatCell key={b} beat={b} currentBeat={state.currentBeat} isPlaying={state.isPlaying}/>)}
          </div>
          <div className="flex gap-3 items-end">
            {[5,6,7,8].map(b => <BeatCell key={b} beat={b} currentBeat={state.currentBeat} isPlaying={state.isPlaying}/>)}
          </div>
        </div>

        {/* Counter */}
        {state.isPlaying && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            {Math.ceil(state.totalBeats / 8)} bars · {state.totalBeats} beats
          </p>
        )}
      </div>

      {/* ── Play + Tap ─────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pb-6 px-6 shrink-0">
        {/* Play/Stop */}
        <button
          onClick={toggle}
          style={{
            width: 80, height: 80, borderRadius: '50%', fontSize: 24,
            background: state.isPlaying ? 'rgba(255,255,255,0.06)' : '#FF4D00',
            border: state.isPlaying ? '1px solid rgba(255,255,255,0.1)' : '1px solid #FF4D00',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background .15s, border-color .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {state.isPlaying ? '■' : '▶'}
        </button>

        {/* Tap BPM */}
        <button
          onClick={handleTap}
          style={{
            width: '100%', maxWidth: 280, padding: '12px 0', borderRadius: 4,
            fontSize: 13, fontWeight: 500, letterSpacing: '0.05em',
            background: tapFlash ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tapFlash ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
            color: tapFlash ? '#FF4D00' : 'rgba(255,255,255,0.35)',
            cursor: 'pointer', transition: 'all .08s',
            userSelect: 'none',
          }}
        >
          TAP BPM
        </button>

        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
          Space = play/stop · T = tap · ← → = ±1 BPM
        </p>
      </div>

      {/* ── Settings ───────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0F0F12' }}>
        <div className="max-w-sm mx-auto space-y-3">

          {/* Sound */}
          <Row label="Sound">
            <SegControl
              options={[
                { value: 'beep',  label: 'Beep'  },
                { value: 'wood',  label: 'Wood'  },
                { value: 'click', label: 'Click' },
              ]}
              value={state.soundType}
              onChange={v => setSoundType(v as 'beep' | 'wood' | 'click')}
            />
          </Row>

          {/* Accent */}
          <Row label="Accent">
            <SegControl
              options={[
                { value: '1', label: 'Beat 1 only' },
                { value: '2', label: 'All beats'   },
              ]}
              value={String(state.accent)}
              onChange={v => setAccent(Number(v) as 1 | 2)}
            />
          </Row>

          {/* Volume */}
          <Row label="Volume">
            <input
              type="range" min="0" max="1" step="0.05"
              value={state.volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#FF4D00' }}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 28, textAlign: 'right' }}>
              {Math.round(state.volume * 100)}
            </span>
          </Row>

          {/* Vibration */}
          {hasVibrate && (
            <Row label="Vibrate">
              <Toggle value={state.vibrateEnabled} onChange={setVibrateEnabled}/>
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub components ───────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 52, flexShrink: 0 }}>
        {label}
      </span>
      <div className="flex-1 flex items-center gap-2">{children}</div>
    </div>
  );
}

function SegControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 flex-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 4, fontSize: 11, fontWeight: 500,
            background: value === o.value ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${value === o.value ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
            color: value === o.value ? '#FF4D00' : 'rgba(255,255,255,0.3)',
            cursor: 'pointer', transition: 'all .12s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, padding: 2,
        background: value ? '#FF4D00' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
        display: 'flex', alignItems: 'center',
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        display: 'block', transition: 'transform .2s',
        transform: value ? 'translateX(16px)' : 'translateX(0)',
      }}/>
    </button>
  );
}
