import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import type { DancerGroup } from '../../types';
import { GROUP_COLORS } from '../../store/formationStore';

interface Props {
  groups: DancerGroup[];
  selectedDancerIds: string[];
  onCreateGroup: (name: string, color: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAssign: (dancerIds: string[], groupId: string) => void;
  onSelectGroup: (groupId: string) => void;
}

export default function GroupPanel({
  groups,
  selectedDancerIds,
  onCreateGroup,
  onDeleteGroup,
  onAssign,
  onSelectGroup,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(GROUP_COLORS[0]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateGroup(newName.trim(), newColor);
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">グループ</span>
        <button
          onClick={() => setCreating(v => !v)}
          className="w-6 h-6 rounded-sm flex items-center justify-center text-white/40 hover:text-[#FF4D00] hover:bg-[#FF4D00]/10 transition-all"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white/5 rounded-md p-3 border border-white/8 space-y-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="グループ名..."
            className="w-full bg-white/10 rounded-sm px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
          />
          <div className="flex gap-1.5">
            {GROUP_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-5 h-5 rounded-sm transition-all hover:scale-110"
                style={{
                  background: c,
                  boxShadow: newColor === c ? `0 0 0 2px #0A0A0C, 0 0 0 3.5px ${c}` : 'none',
                }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 py-1 rounded-sm bg-[#FF4D00] text-white text-xs font-medium disabled:opacity-40"
            >
              作成
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-2 py-1 rounded-sm bg-white/8 text-white/40 text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Group list */}
      {groups.length === 0 ? (
        <p className="text-[10px] text-white/20 text-center py-3">グループなし</p>
      ) : (
        <div className="space-y-1.5">
          {groups.map(g => (
            <div
              key={g.id}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer transition-all"
              onClick={() => onSelectGroup(g.id)}
            >
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: g.color }} />
              <span className="flex-1 text-xs text-white/70 truncate">{g.name}</span>
              <span className="text-[10px] text-white/25 flex items-center gap-0.5">
                <Users size={9} />{g.dancerIds.length}
              </span>
              {/* Assign selected */}
              {selectedDancerIds.length > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); onAssign(selectedDancerIds, g.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 rounded-md bg-[#FF4D00]/20 text-[#FF4D00] transition-all"
                >
                  割当
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onDeleteGroup(g.id); }}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-white/25 hover:text-red-400 transition-all"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
