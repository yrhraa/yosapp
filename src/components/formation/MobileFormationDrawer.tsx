import { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Play, Pause, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Formation, CountBlock, ProjectConfig } from '../../types';

interface Props {
  formations: Formation[];
  activeFormation: Formation;
  onSelectFormation: (id: string) => void;
  onCreateFormation: () => void;
  // Timeline
  timeline: CountBlock[];
  activeBlockIndex: number;
  config: ProjectConfig;
  onJumpBlock: (i: number) => void;
  onSaveBlock: () => void;
  // Playback simulation
  isPlaying: boolean;
  onTogglePlay: () => void;
  // Selected dancer info
  selectedDancerName: string | null;
  onDeselectDancer: () => void;
}

const COUNTS_PER_BLOCK = 8;

function blockTime(bpm: number, index: number) {
  const sec = (60 / bpm) * COUNTS_PER_BLOCK * index;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MobileFormationDrawer({
  formations, activeFormation,
  onSelectFormation, onCreateFormation,
  timeline, activeBlockIndex, config,
  onJumpBlock, onSaveBlock,
  isPlaying, onTogglePlay,
  selectedDancerName, onDeselectDancer,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<'list' | 'timeline'>('timeline');

  const prev = () => activeBlockIndex > 0 && onJumpBlock(activeBlockIndex - 1);
  const next = () => activeBlockIndex < timeline.length - 1 && onJumpBlock(activeBlockIndex + 1);

  return (
    <>
      {/* ── Selected dancer pill ────────────────────────────── */}
      {selectedDancerName && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2
          bg-[#1A1A1F]/95 border border-[#FF4D00]/30 rounded-sm px-4 py-1.5">
          <div className="w-2 h-2 rounded-sm bg-[#FF4D00]"/>
          <span className="text-sm text-white font-medium">{selectedDancerName}</span>
          <button onClick={onDeselectDancer} className="text-white/40 hover:text-white ml-1 text-xs">✕</button>
        </div>
      )}

      {/* ── Bottom sheet ────────────────────────────────────── */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col
        bg-[#0F0F12]/97 border-t border-white/8 rounded-t-2xl
        transition-all duration-300 ease-out
        ${drawerOpen ? 'h-72' : 'h-28'}`}
      >
        {/* Drag handle + toggle */}
        <button
          onClick={() => setDrawerOpen(v => !v)}
          className="flex items-center justify-center gap-2 py-2 shrink-0"
        >
          <div className="w-8 h-1 rounded-sm bg-white/20"/>
          {drawerOpen ? <ChevronDown size={14} className="text-white/30"/> : <ChevronUp size={14} className="text-white/30"/>}
        </button>

        {/* ── Collapsed: timeline scrubber + play ─────────── */}
        <div className={`px-4 shrink-0 ${drawerOpen ? 'hidden' : 'block'}`}>
          <div className="flex items-center gap-3">
            {/* Play/stop */}
            <button
              onClick={onTogglePlay}
              className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-all  ${
                isPlaying ? 'bg-white/15 border border-white/20' : 'bg-[#FF4D00]'
              }`}
            >
              {isPlaying ? <Pause size={16} fill="white"/> : <Play size={16} fill="white" className="ml-0.5"/>}
            </button>

            {/* Block scrubber */}
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button onClick={prev} disabled={activeBlockIndex === 0}
                  className="text-white/40 disabled:opacity-20">
                  <ChevronLeft size={16}/>
                </button>
                <div className="flex-1 flex gap-0.5 overflow-hidden">
                  {timeline.slice(Math.max(0, activeBlockIndex - 3), activeBlockIndex + 6).map((block, idx) => {
                    const realIdx = Math.max(0, activeBlockIndex - 3) + idx;
                    const isActive = realIdx === activeBlockIndex;
                    return (
                      <button key={block.id} onClick={() => onJumpBlock(realIdx)}
                        className={`flex-1 h-6 rounded transition-all min-w-0 ${
                          isActive ? 'bg-[#FF4D00]' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
                <button onClick={next} disabled={activeBlockIndex === timeline.length - 1}
                  className="text-white/40 disabled:opacity-20">
                  <ChevronRight size={16}/>
                </button>
              </div>
              <div className="flex justify-between text-[9px] text-white/25 font-mono">
                <span>{blockTime(config.bpm, activeBlockIndex)}</span>
                <span>{activeBlockIndex + 1} / {timeline.length}ブロック</span>
                <span>{blockTime(config.bpm, timeline.length)}</span>
              </div>
            </div>

            {/* Save current */}
            <button onClick={onSaveBlock}
              className="w-10 h-10 rounded-md bg-white/8 flex items-center justify-center text-white/40 hover:text-white  transition-all border border-white/8">
              <Check size={15}/>
            </button>
          </div>
        </div>

        {/* ── Expanded content ─────────────────────────────── */}
        {drawerOpen && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex gap-1 px-4 pb-2 shrink-0">
              {(['timeline', 'list'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${
                    tab === t ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30'
                             : 'bg-white/5 text-white/40 border border-transparent'
                  }`}>
                  {t === 'timeline' ? 'タイムライン' : 'フォーメーション一覧'}
                </button>
              ))}
            </div>

            {tab === 'timeline' && (
              <div className="flex-1 overflow-x-auto overflow-y-hidden px-4">
                <div className="flex gap-2 h-full items-center pb-2" style={{ minWidth: 'max-content' }}>
                  {timeline.map((block, i) => {
                    const isActive = i === activeBlockIndex;
                    return (
                      <button key={block.id} onClick={() => { onJumpBlock(i); }}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md min-w-[72px] transition-all border ${
                          isActive
                            ? 'bg-[#FF4D00]/20 border-[#FF4D00]/50'
                            : 'bg-white/5 border-white/8 hover:bg-white/10'
                        }`}>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-[#FF4D00]' : 'text-white/30'}`}>
                          #{i + 1}
                        </span>
                        <span className={`text-[11px] font-medium truncate max-w-[60px] ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {block.label}
                        </span>
                        <span className="text-[9px] text-white/20 font-mono">
                          {blockTime(config.bpm, i)}
                        </span>
                        {isActive && <div className="w-full h-0.5 rounded bg-[#FF4D00]"/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'list' && (
              <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-2">
                {formations.map(f => {
                  const isActive = f.id === activeFormation.id;
                  return (
                    <button key={f.id} onClick={() => { onSelectFormation(f.id); setDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all border ${
                        isActive
                          ? 'bg-[#FF4D00]/12 border-[#FF4D00]/35'
                          : 'bg-white/4 border-white/6 hover:bg-white/8'
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${isActive ? 'bg-[#FF4D00]' : 'bg-white/20'}`}/>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/65'}`}>
                          {f.name}
                        </p>
                        <p className="text-[10px] text-white/25">{f.dancers.length}人 · {f.timeline?.length ?? 0}ブロック</p>
                      </div>
                      {isActive && <ChevronRight size={12} className="text-[#FF4D00] shrink-0"/>}
                    </button>
                  );
                })}
                <button onClick={() => { onCreateFormation(); setDrawerOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-dashed border-white/15 text-white/35 hover:border-[#FF4D00]/40 hover:text-[#FF4D00] transition-all">
                  <Plus size={14}/>
                  <span className="text-sm">新しいフォーメーションを追加</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
