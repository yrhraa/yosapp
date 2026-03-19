import { useRef, useEffect, useCallback } from 'react';

interface Props {
  waveformData: Float32Array;
  duration: number;
  currentTime: number;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  /** 'seek' | 'setStart' | 'setEnd' */
  mode: 'seek' | 'setStart' | 'setEnd';
  onSeek: (sec: number) => void;
  onSetLoopStart: (sec: number) => void;
  onSetLoopEnd: (sec: number) => void;
}

export default function WaveformCanvas({
  waveformData, duration, currentTime,
  loopStart, loopEnd, loopEnabled,
  mode, onSeek, onSetLoopStart, onSetLoopEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Convert pixel x → time
  const xToTime = useCallback((clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  const applyAction = useCallback((clientX: number) => {
    const t = xToTime(clientX);
    if (mode === 'seek') onSeek(t);
    else if (mode === 'setStart') onSetLoopStart(t);
    else onSetLoopEnd(t);
  }, [mode, xToTime, onSeek, onSetLoopStart, onSetLoopEnd]);

  // ── Draw ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const mid = H / 2;

    // Resolve CSS variables (approximate — use hardcoded for reliability in canvas)
    const BG      = '#0A0A0C';
    const LOOP_BG = loopEnabled ? 'rgba(255,77,0,0.10)' : 'rgba(255,255,255,0.04)';
    const LOOP_BORDER = loopEnabled ? 'rgba(255,77,0,0.7)' : 'rgba(255,255,255,0.2)';
    const WAVE_NORMAL  = 'rgba(255,255,255,0.22)';
    const WAVE_LOOP    = loopEnabled ? '#FF4D00' : 'rgba(255,255,255,0.45)';
    const WAVE_PLAYED  = 'rgba(255,255,255,0.5)';
    const PLAYHEAD     = '#ffffff';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    if (duration === 0 || waveformData.length === 0) return;

    const loopStartX = (loopStart / duration) * W;
    const loopEndX   = (loopEnd   / duration) * W;
    const playX      = (currentTime / duration) * W;

    // Loop region fill
    ctx.fillStyle = LOOP_BG;
    ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, H);

    // Waveform bars
    const barW = Math.max(1, W / waveformData.length);
    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / waveformData.length) * W;
      const barH = waveformData[i] * mid * 0.92;
      const tAtBar = (i / waveformData.length) * duration;

      let color: string;
      if (tAtBar <= currentTime) color = WAVE_PLAYED;
      else if (tAtBar >= loopStart && tAtBar <= loopEnd) color = WAVE_LOOP;
      else color = WAVE_NORMAL;

      ctx.fillStyle = color;
      ctx.fillRect(x, mid - barH, barW - 0.5, barH * 2);
    }

    // Center line
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(W, mid);
    ctx.stroke();

    // Loop start handle
    ctx.strokeStyle = LOOP_BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(loopStartX, 0);
    ctx.lineTo(loopStartX, H);
    ctx.stroke();
    // Triangle handle
    ctx.fillStyle = LOOP_BORDER;
    ctx.beginPath();
    ctx.moveTo(loopStartX, 0);
    ctx.lineTo(loopStartX + 10, 0);
    ctx.lineTo(loopStartX, 12);
    ctx.closePath();
    ctx.fill();

    // Loop end handle
    ctx.strokeStyle = LOOP_BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(loopEndX, 0);
    ctx.lineTo(loopEndX, H);
    ctx.stroke();
    ctx.fillStyle = LOOP_BORDER;
    ctx.beginPath();
    ctx.moveTo(loopEndX, 0);
    ctx.lineTo(loopEndX - 10, 0);
    ctx.lineTo(loopEndX, 12);
    ctx.closePath();
    ctx.fill();

    // Playhead
    ctx.strokeStyle = PLAYHEAD;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Playhead diamond
    ctx.fillStyle = PLAYHEAD;
    ctx.beginPath();
    ctx.arc(playX, mid, 4, 0, Math.PI * 2);
    ctx.fill();

  }, [waveformData, duration, currentTime, loopStart, loopEnd, loopEnabled]);

  // Mouse / touch
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    applyAction(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    applyAction(e.clientX);
  };
  const handlePointerUp = () => { isDragging.current = false; };

  const cursorMap = { seek: 'pointer', setStart: 'col-resize', setEnd: 'col-resize' };

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={100}
      className="w-full rounded-md"
      style={{ cursor: cursorMap[mode], touchAction: 'none', height: '100px' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
