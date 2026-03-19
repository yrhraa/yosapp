import { useState } from 'react';
import { Plus, Trash2, Copy, ChevronRight, Pencil, Check, Clapperboard, MapPin, Users } from 'lucide-react';
import type { Formation } from '../../types';

interface Props {
  formations: Formation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function FormationList({
  formations, activeId,
  onSelect, onCreate, onDelete, onDuplicate, onRename,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName]   = useState('');

  const startEdit = (f: Formation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(f.id);
    setEditName(f.name);
  };

  const commitEdit = (id: string) => {
    if (editName.trim()) onRename(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
          フォーメーション
        </span>
        <button
          onClick={onCreate}
          title="新規作成"
          className="w-7 h-7 rounded-sm flex items-center justify-center text-white/40 hover:text-[#FF4D00] hover:bg-[#FF4D00]/10 transition-all"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {formations.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-white/20 text-xs text-center">フォーメーションなし</p>
            <button
              onClick={onCreate}
              className="text-[11px] px-3 py-1.5 rounded-sm bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/20 hover:bg-[#FF4D00]/25 transition-all"
            >
              + 新規作成
            </button>
          </div>
        )}

        {formations.map(f => {
          const isActive   = f.id === activeId;
          const scaleLabel = f.config?.scale === 'large' ? '大人数' : '少人数';
          const stageIcon  = f.config?.stage === 'street'
            ? <MapPin size={9} className="shrink-0" />
            : <Clapperboard size={9} className="shrink-0" />;

          return (
            <div
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={`group relative rounded-md px-3 py-2.5 cursor-pointer transition-all border ${
                isActive
                  ? 'bg-[#FF4D00]/12 border-[#FF4D00]/35'
                  : 'bg-white/4 border-white/5 hover:bg-white/7 hover:border-white/12'
              }`}
            >
              {/* Name row */}
              <div className="flex items-center gap-2 pr-16">
                {editingId === f.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(f.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => commitEdit(f.id)}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-white/10 rounded px-2 py-0.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/40 min-w-0"
                  />
                ) : (
                  <span className={`flex-1 text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/65'}`}>
                    {f.name}
                  </span>
                )}
                {isActive && !editingId && (
                  <ChevronRight size={11} className="text-[#FF4D00] shrink-0" />
                )}
              </div>

              {/* Meta row: config badges */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                  isActive ? 'bg-[#FF4D00]/20 text-[#FF4D00]' : 'bg-white/8 text-white/30'
                }`}>
                  {stageIcon}&nbsp;{scaleLabel}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-white/25">
                  <Users size={8} />&nbsp;{f.dancers.length}人
                </span>
                <span className="text-[9px] text-white/18">
                  {f.timeline?.length ?? 0}ブロック
                </span>
              </div>

              {/* Hover actions */}
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 transition-all ${
                editingId === f.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {editingId === f.id ? (
                  <button
                    onClick={e => { e.stopPropagation(); commitEdit(f.id); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-[#FF4D00] hover:bg-[#FF4D00]/15"
                  >
                    <Check size={11} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={e => startEdit(f, e)}
                      className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDuplicate(f.id); }}
                      className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Copy size={10} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (formations.length > 1) onDelete(f.id);
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                        formations.length > 1
                          ? 'text-white/30 hover:text-red-400 hover:bg-red-400/10'
                          : 'text-white/10 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 size={10} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
