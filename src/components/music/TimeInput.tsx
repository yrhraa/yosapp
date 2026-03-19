import { useState, useEffect, useRef } from 'react';

interface Props {
  value: number;       // seconds
  max: number;
  onChange: (sec: number) => void;
  label: string;
  color?: string;
}

function secToStr(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

function strToSec(s: string): number | null {
  const m = s.match(/^(\d+):(\d+(?:\.\d*)?)$/);
  if (!m) return null;
  const val = parseInt(m[1]) * 60 + parseFloat(m[2]);
  return isNaN(val) ? null : val;
}

export default function TimeInput({ value, max, onChange, label, color = '#FF4D00' }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) return;
    setDraft(secToStr(value));
  }, [value, editing]);

  const commit = () => {
    const parsed = strToSec(draft);
    if (parsed !== null) onChange(Math.max(0, Math.min(parsed, max)));
    else setDraft(secToStr(value));
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); } }}
          className="w-20 bg-white/15 rounded-sm px-2 py-1 text-center text-sm text-white outline-none font-mono focus:ring-1"
          style={{ caretColor: color }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setDraft(secToStr(value)); setTimeout(() => inputRef.current?.select(), 10); }}
          className="w-20 rounded-sm px-2 py-1 text-center text-sm font-mono font-semibold transition-all hover:bg-white/10"
          style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
        >
          {secToStr(value)}
        </button>
      )}
    </div>
  );
}
