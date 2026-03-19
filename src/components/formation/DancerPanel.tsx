import { useState } from 'react';
import { X, Trash2, Navigation2, User } from 'lucide-react';
import type { Dancer } from '../../types';

interface Props {
  dancer: Dancer | null;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onClearRoute: (id: string) => void;
  hasRoute: boolean;
}

const PRESET_COLORS = [
  '#FF4D00', '#1D9E75', '#185FA5', '#BA7517',
  '#D4537E', '#534AB7', '#3B6D11', '#A32D2D',
  '#0F6E56', '#993C1D', '#3C3489', '#5F5E5A',
];

export default function DancerPanel({
  dancer,
  onClose,
  onRename,
  onChangeColor,
  onDelete,
  onClearRoute,
  hasRoute,
}: Props) {
  const [nameEdit, setNameEdit] = useState('');
  const [editing, setEditing] = useState(false);

  if (!dancer) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-white/20 select-none">
        <User size={32} strokeWidth={1} />
        <p className="text-sm">ダンサーを選択してください</p>
      </div>
    );
  }

  const startEdit = () => {
    setNameEdit(dancer.name);
    setEditing(true);
  };

  const commitEdit = () => {
    if (nameEdit.trim()) onRename(dancer.id, nameEdit.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-sm"
            style={{ background: dancer.color }}
          >
            {dancer.name.length > 2 ? dancer.number : dancer.name}
          </div>
          <div>
            <p className="text-xs text-white/40">選択中のダンサー</p>
            <p className="text-sm font-semibold text-white">{dancer.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-sm flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Name edit */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">名前</label>
        {editing ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={nameEdit}
              onChange={e => setNameEdit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
              onBlur={commitEdit}
              className="flex-1 bg-white/10 rounded-sm px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/50"
            />
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="w-full text-left bg-white/5 hover:bg-white/10 rounded-sm px-3 py-1.5 text-sm text-white/80 hover:text-white transition-all border border-white/5 hover:border-white/20"
          >
            {dancer.name}
            <span className="text-white/30 text-xs ml-2">タップして編集</span>
          </button>
        )}
      </div>

      {/* Color picker */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">カラー</label>
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onChangeColor(dancer.id, c)}
              className="w-7 h-7 rounded-sm transition-all hover:scale-110"
              style={{
                background: c,
                boxShadow: dancer.color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">位置</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 rounded-sm px-3 py-1.5 border border-white/5">
            <span className="text-[10px] text-white/30">X</span>
            <p className="text-sm text-white/70">{dancer.x}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-sm px-3 py-1.5 border border-white/5">
            <span className="text-[10px] text-white/30">Y</span>
            <p className="text-sm text-white/70">{dancer.y}</p>
          </div>
        </div>
      </div>

      {/* Route actions */}
      {hasRoute && (
        <button
          onClick={() => onClearRoute(dancer.id)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-orange-500/10 text-white/50 hover:text-orange-400 text-sm transition-all border border-white/5 hover:border-orange-500/20"
        >
          <Navigation2 size={14} />
          ルートをクリア
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => { onDelete(dancer.id); onClose(); }}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all border border-red-500/10 hover:border-red-500/30 mt-auto"
      >
        <Trash2 size={14} />
        ダンサーを削除
      </button>
    </div>
  );
}
