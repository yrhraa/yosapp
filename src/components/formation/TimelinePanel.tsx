import { useRef, useState } from 'react';
import { Plus, Trash2, Save, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { CountBlock, ProjectConfig } from '../../types';

interface Props {
  timeline: CountBlock[];
  activeIndex: number;
  config: ProjectConfig;
  onJump: (index: number) => void;
  onSave: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onRelabel: (index: number, label: string) => void;
}

const COUNTS_PER_BLOCK = 8;

function formatTime(bpm: number, blockIndex: number): string {
  const secPerBlock = (60 / bpm) * COUNTS_PER_BLOCK;
  const totalSec = Math.round(blockIndex * secPerBlock);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TimelinePanel({
  timeline,
  activeIndex,
  config,
  onJump,
  onSave,
  onAdd,
  onRemove,
  onRelabel,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const totalSec = (60 / config.bpm) * COUNTS_PER_BLOCK * timeline.length;
  const maxSec = 300;
  const progress = Math.min(totalSec / maxSec, 1);

  const startEdit = (index: number, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditLabel(label);
  };

  const commitEdit = () => {
    if (editingIndex !== null && editLabel.trim()) {
      onRelabel(editingIndex, editLabel.trim());
    }
    setEditingIndex(null);
  };

  const scrollBy = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest shrink-0">
          タイムライン
        </span>

        {/* Duration bar */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/8 rounded-sm overflow-hidden">
            <div
              className="h-full bg-[#FF4D00] rounded-sm transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-white/30 shrink-0 flex items-center gap-1">
            <Clock size={10} />
            {formatTime(config.bpm, timeline.length)} / 5:00
          </span>
        </div>

        {/* BPM badge */}
        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-white/8 text-white/30">
          {config.bpm} BPM · {timeline.length}ブロック
        </span>

        {/* Save current block */}
        <button
          onClick={onSave}
          title="現在の配置を保存"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#FF4D00]/15 hover:bg-[#FF4D00]/25 text-[#FF4D00] text-[11px] font-medium transition-all border border-[#FF4D00]/20"
        >
          <Save size={12} />
          保存
        </button>

        {/* Add block */}
        <button
          onClick={onAdd}
          disabled={totalSec >= maxSec}
          title="8カウントブロックを追加"
          className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-white/8 hover:bg-white/14 text-white/50 hover:text-white text-[11px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          追加
        </button>
      </div>

      {/* Scroll row */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-r from-[#0A0A0C] to-transparent text-white/30 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Blocks */}
        <div
          ref={scrollRef}
          className="overflow-x-auto flex gap-1.5 px-7 pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {timeline.map((block, i) => {
            const isActive = i === activeIndex;
            const time = formatTime(config.bpm, i);
            return (
              <div
                key={block.id}
                onClick={() => onJump(i)}
                className={`group flex-none flex flex-col gap-0.5 cursor-pointer rounded-md px-2.5 py-2 min-w-[72px] transition-all border ${
                  isActive
                    ? 'bg-[#FF4D00]/20 border-[#FF4D00]/50'
                    : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                {/* Block number */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-bold ${isActive ? 'text-[#FF4D00]' : 'text-white/30'}`}>
                    #{i + 1}
                  </span>
                  {/* Delete (only show on hover, only if more than 1 block) */}
                  {timeline.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); onRemove(i); }}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={9} />
                    </button>
                  )}
                </div>

                {/* Label (editable on dbl-click) */}
                {editingIndex === i ? (
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); }}
                    onBlur={commitEdit}
                    onClick={e => e.stopPropagation()}
                    className="w-full bg-white/10 rounded px-1 py-0.5 text-[10px] text-white outline-none"
                    style={{ minWidth: 0 }}
                  />
                ) : (
                  <span
                    onDoubleClick={e => startEdit(i, block.label, e)}
                    className={`text-[10px] font-medium truncate leading-tight ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                    title={block.label + ' (ダブルクリックで編集)'}
                  >
                    {block.label}
                  </span>
                )}

                {/* Timecode */}
                <span className="text-[9px] text-white/20 font-mono">{time}</span>

                {/* Active indicator bar */}
                {isActive && (
                  <div className="h-0.5 w-full rounded-sm bg-[#FF4D00] mt-0.5" />
                )}
              </div>
            );
          })}

          {/* End marker */}
          <div className="flex-none flex items-center justify-center min-w-[32px]">
            <div className="w-px h-8 bg-white/10 flex flex-col items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-sm bg-white/15 -mt-1" />
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-l from-[#0A0A0C] to-transparent text-white/30 hover:text-white transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Prev / Next nav */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => activeIndex > 0 && onJump(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="flex items-center gap-1 px-3 py-1 rounded-sm bg-white/5 text-white/40 hover:text-white hover:bg-white/10 text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={12} /> 前のブロック
        </button>
        <span className="text-xs text-white/25">
          {activeIndex + 1} / {timeline.length}
        </span>
        <button
          onClick={() => activeIndex < timeline.length - 1 && onJump(activeIndex + 1)}
          disabled={activeIndex === timeline.length - 1}
          className="flex items-center gap-1 px-3 py-1 rounded-sm bg-white/5 text-white/40 hover:text-white hover:bg-white/10 text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          次のブロック <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
