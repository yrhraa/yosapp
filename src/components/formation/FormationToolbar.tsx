import { useState } from 'react';
import { MousePointer2, UserPlus, Navigation2, Trash2, RotateCcw, Download, Users } from 'lucide-react';
import type { ToolMode } from '../../types';

interface Props {
  tool: ToolMode;
  onChangeTool: (t: ToolMode) => void;
  onClearAllRoutes: () => void;
  onExport: () => void;
  dancerCount: number;
  selectedCount: number;
  isLarge: boolean;
  onAddBulk: (n: number) => void;
}

const TOOLS: { mode: ToolMode; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { mode: 'select', icon: <MousePointer2 size={15} />, label: '選択', shortcut: 'S' },
  { mode: 'add',    icon: <UserPlus size={15} />,       label: '追加', shortcut: 'A' },
  { mode: 'route',  icon: <Navigation2 size={15} />,     label: 'ルート', shortcut: 'R' },
  { mode: 'delete', icon: <Trash2 size={15} />,         label: '削除', shortcut: 'D' },
];

export default function FormationToolbar({
  tool, onChangeTool, onClearAllRoutes, onExport,
  dancerCount, selectedCount, isLarge, onAddBulk,
}: Props) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkNum, setBulkNum] = useState(8);

  return (
    <div className="flex items-center gap-2 flex-wrap relative">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-1 border border-white/8">
        {TOOLS.map(t => (
          <button
            key={t.mode}
            onClick={() => onChangeTool(t.mode)}
            title={`${t.label} (${t.shortcut})`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all ${
              tool === t.mode
                ? 'bg-[#FF4D00] text-white'
                : 'text-white/45 hover:text-white hover:bg-white/8'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Selection info */}
      {selectedCount > 0 && (
        <span className="text-xs text-[#FF4D00]/80 bg-[#FF4D00]/10 px-2 py-1 rounded-sm border border-[#FF4D00]/20">
          {selectedCount}人選択中
        </span>
      )}

      {/* Bulk add (large mode) */}
      {isLarge && (
        <div className="relative">
          <button
            onClick={() => setBulkOpen(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/45 hover:text-white text-xs transition-all border border-white/8"
          >
            <Users size={13} />
            <span className="hidden sm:inline">一括追加</span>
          </button>
          {bulkOpen && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-[#1A1A1F] border border-white/10 rounded-md p-3 flex items-center gap-2 min-w-[180px]">
              <input
                type="number" min="1" max="50" value={bulkNum}
                onChange={e => setBulkNum(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-14 bg-white/10 rounded-sm px-2 py-1 text-sm text-white text-center outline-none"
              />
              <span className="text-xs text-white/40">人</span>
              <button
                onClick={() => { onAddBulk(bulkNum); setBulkOpen(false); }}
                className="flex-1 py-1 rounded-sm bg-[#FF4D00] text-white text-xs font-semibold"
              >
                追加
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Dancer count */}
      <span className="text-xs text-white/25 hidden sm:block">{dancerCount}人</span>

      {/* Clear routes */}
      <button
        onClick={onClearAllRoutes}
        title="全ルートをクリア"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/35 hover:text-white/70 text-xs transition-all border border-white/5"
      >
        <RotateCcw size={12} />
        <span className="hidden sm:inline">ルートクリア</span>
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-[#FF4D00]/15 text-white/35 hover:text-[#FF4D00] text-xs transition-all border border-white/5 hover:border-[#FF4D00]/25"
      >
        <Download size={12} />
        <span className="hidden sm:inline">書き出し</span>
      </button>
    </div>
  );
}
