import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormationStore, getCanvasSizeFor } from '../store/formationStore';
import { useIsMobile } from '../hooks/useIsMobile';
import FormationCanvas from '../components/formation/FormationCanvas';
import FormationList from '../components/formation/FormationList';
import FormationToolbar from '../components/formation/FormationToolbar';
import DancerPanel from '../components/formation/DancerPanel';
import TimelinePanel from '../components/formation/TimelinePanel';
import GroupPanel from '../components/formation/GroupPanel';
import NewFormationWizard from '../components/formation/NewFormationWizard';
import MobileFormationDrawer from '../components/formation/MobileFormationDrawer';
import type { ToolMode, ScaleMode, StageMode, ProjectConfig } from '../types';
import { LayoutGrid, Users, Settings2 } from 'lucide-react';

type RightTab = 'dancer' | 'groups' | 'config';

export default function FormationPage() {
  const store      = useFormationStore();
  const isMobile   = useIsMobile();
  const formation  = store.getActiveFormation();

  const [tool, setTool]             = useState<ToolMode>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [routingId, setRoutingId]   = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [rightTab, setRightTab]     = useState<RightTab>('dancer');
  const [mobilePlaying, setMobilePlay] = useState(false);
  const mobilePlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear selection on formation change
  useEffect(() => {
    setSelectedIds(new Set());
    setRoutingId(null);
    setMobilePlay(false);
  }, [store.activeFormationId]);

  // ── PC keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    if (isMobile) return;
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const map: Record<string, ToolMode> = { s: 'select', a: 'add', r: 'route', d: 'delete' };
      if (map[e.key.toLowerCase()]) { setTool(map[e.key.toLowerCase()]); return; }
      if (e.key === 'Escape') { setSelectedIds(new Set()); setRoutingId(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0 && formation) {
        [...selectedIds].forEach(id => store.deleteDancer(formation.id, id));
        setSelectedIds(new Set());
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isMobile, selectedIds, formation, store]);

  // ── Mobile timeline playback ───────────────────────────────
  const toggleMobilePlay = useCallback(() => {
    if (!formation) return;
    if (mobilePlaying) {
      if (mobilePlayRef.current) clearInterval(mobilePlayRef.current);
      mobilePlayRef.current = null;
      setMobilePlay(false);
    } else {
      setMobilePlay(true);
      mobilePlayRef.current = setInterval(() => {
        store.jumpToBlock(formation.id, store.getActiveFormation()?.activeBlockIndex ?? 0);
        const cur = store.getActiveFormation()?.activeBlockIndex ?? 0;
        const len = store.getActiveFormation()?.timeline.length ?? 1;
        if (cur >= len - 1) {
          if (mobilePlayRef.current) clearInterval(mobilePlayRef.current);
          setMobilePlay(false);
        } else {
          store.setActiveBlock(formation.id, cur + 1);
        }
      }, Math.round((60 / formation.config.bpm) * 8 * 1000));
    }
  }, [mobilePlaying, formation, store]);

  useEffect(() => () => { if (mobilePlayRef.current) clearInterval(mobilePlayRef.current); }, []);

  // ── Select / move ──────────────────────────────────────────
  const handleSelect = useCallback((id: string, multi = false) => {
    setSelectedIds(prev => {
      if (multi) { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }
      return prev.has(id) && prev.size === 1 ? prev : new Set([id]);
    });
  }, []);

  const handleMoveGroup = useCallback((ids: string[], dx: number, dy: number) => {
    if (!formation) return;
    const canvas = getCanvasSizeFor(formation.config);
    const R = formation.config.scale === 'large' ? 8 : 18;
    ids.forEach(id => {
      const d = formation.dancers.find(d => d.id === id);
      if (!d) return;
      store.updateDancer(formation.id, id, {
        x: Math.max(R, Math.min(canvas.w - R, d.x + dx)),
        y: Math.max(R, Math.min(canvas.h - R, d.y + dy)),
      });
    });
  }, [formation, store]);

  const handleExport = () => {
    if (!formation) return;
    const svg = document.querySelector('svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${formation.name}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedDancerId = selectedIds.size === 1 ? [...selectedIds][0] : null;
  const selectedDancer   = formation?.dancers.find(d => d.id === selectedDancerId) ?? null;

  if (!formation) return (
    <div className="h-full flex items-center justify-center text-white/20 text-sm">
      フォーメーションがありません
    </div>
  );

  const isLarge = formation.config.scale === 'large';

  // ── Common canvas props ────────────────────────────────────
  const canvasProps = {
    formation,
    selectedIds,
    onSelect: handleSelect,
    onClearSelection: () => setSelectedIds(new Set()),
    onMove: (id: string, x: number, y: number) => store.updateDancer(formation.id, id, { x, y }),
    onMoveGroup: handleMoveGroup,
    onAdd: (x: number, y: number) => store.addDancer(formation.id, x, y),
    onAddRoutePoint: (dancerId: string, x: number, y: number) => store.addRoutePoint(formation.id, dancerId, x, y),
    onDelete: (id: string) => { store.deleteDancer(formation.id, id); setSelectedIds(new Set()); },
    routingId,
    onSetRoutingId: setRoutingId,
  };

  /* ════════════════════════════════════════════════════════════
     MOBILE LAYOUT
  ════════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="relative h-full overflow-hidden bg-[#0A0A0C]">
        {/* Full-screen canvas */}
        <div className="absolute inset-0 bottom-28 overflow-auto">
          <FormationCanvas
            {...canvasProps}
            tool="select"
            simpleMode={true}
          />
        </div>

        {/* Bottom drawer */}
        <MobileFormationDrawer
          formations={store.formations}
          activeFormation={formation}
          onSelectFormation={store.setActiveFormation}
          onCreateFormation={() => setShowWizard(true)}
          timeline={formation.timeline}
          activeBlockIndex={formation.activeBlockIndex}
          config={formation.config}
          onJumpBlock={i => store.jumpToBlock(formation.id, i)}
          onSaveBlock={() => store.saveSnapshot(formation.id)}
          isPlaying={mobilePlaying}
          onTogglePlay={toggleMobilePlay}
          selectedDancerName={selectedDancer?.name ?? null}
          onDeselectDancer={() => setSelectedIds(new Set())}
        />

        {/* Wizard */}
        {showWizard && (
          <NewFormationWizard
            onConfirm={(name, scale, stage) => {
              store.createFormation(name, scale as ScaleMode, stage as StageMode);
              setShowWizard(false);
            }}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     PC LAYOUT  (3-column + timeline)
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-full overflow-hidden gap-0">

      {/* ── Left sidebar: formation list ─────────────────── */}
      <aside className="w-52 shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3">
          <FormationList
            formations={store.formations}
            activeId={store.activeFormationId}
            onSelect={store.setActiveFormation}
            onCreate={() => setShowWizard(true)}
            onDelete={store.deleteFormation}
            onDuplicate={store.duplicateFormation}
            onRename={store.updateFormationName}
          />
        </div>
        <div className="px-3 py-2 border-t border-white/5">
          <div className="px-2.5 py-1.5 rounded-md bg-white/5 border border-white/5">
            <span className="text-[10px] text-white/30">
              {formation.config.scale === 'small' ? '少人数' : '大人数'} ·{' '}
              {formation.config.stage === 'stage' ? 'ステージ' : 'ストリート'} ·{' '}
              {formation.dancers.length}人
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <FormationToolbar
            tool={tool}
            onChangeTool={t => { setTool(t); if (t !== 'route') setRoutingId(null); }}
            onClearAllRoutes={() => store.clearRoutes(formation.id)}
            onExport={handleExport}
            dancerCount={formation.dancers.length}
            selectedCount={selectedIds.size}
            isLarge={isLarge}
            onAddBulk={n => store.addDancersBulk(formation.id, n)}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0 px-3 overflow-auto">
          <FormationCanvas {...canvasProps} tool={tool} simpleMode={false}/>
        </div>

        {/* Timeline */}
        <div className="px-3 py-3 shrink-0 border-t border-white/5 bg-[#0F0F12]/60">
          <TimelinePanel
            timeline={formation.timeline}
            activeIndex={formation.activeBlockIndex}
            config={formation.config}
            onJump={i => store.jumpToBlock(formation.id, i)}
            onSave={() => store.saveSnapshot(formation.id)}
            onAdd={() => store.addBlock(formation.id)}
            onRemove={i => store.removeBlock(formation.id, i)}
            onRelabel={(i, label) => store.relabelBlock(formation.id, i, label)}
          />
        </div>
      </main>

      {/* ── Right panel ───────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-l border-white/5 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/5 shrink-0">
          {([
            { id: 'dancer' as RightTab,  icon: <LayoutGrid size={13}/>, label: 'ダンサー' },
            ...(isLarge ? [{ id: 'groups' as RightTab, icon: <Users size={13}/>, label: 'グループ' }] : []),
            { id: 'config' as RightTab,  icon: <Settings2 size={13}/>, label: '設定' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setRightTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-all border-b-2 ${
                rightTab === tab.id
                  ? 'text-[#FF4D00] border-[#FF4D00]'
                  : 'text-white/30 border-transparent hover:text-white/60'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {rightTab === 'dancer' && (
            <DancerPanel
              dancer={selectedDancer}
              onClose={() => setSelectedIds(new Set())}
              onRename={(id, name) => store.updateDancer(formation.id, id, { name })}
              onChangeColor={(id, color) => store.updateDancer(formation.id, id, { color })}
              onDelete={id => { store.deleteDancer(formation.id, id); setSelectedIds(new Set()); }}
              onClearRoute={id => store.clearRoutes(formation.id, id)}
              hasRoute={formation.routes.some(r => r.dancerId === selectedDancerId)}
            />
          )}
          {rightTab === 'groups' && (
            <GroupPanel
              groups={formation.groups}
              selectedDancerIds={[...selectedIds]}
              onCreateGroup={(name, color) => store.createGroup(formation.id, name, color)}
              onDeleteGroup={gid => store.deleteGroup(formation.id, gid)}
              onAssign={(ids, gid) => store.assignDancersToGroup(formation.id, ids, gid)}
              onSelectGroup={gid => {
                const g = formation.groups.find(g => g.id === gid);
                if (g) setSelectedIds(new Set(g.dancerIds));
              }}
            />
          )}
          {rightTab === 'config' && (
            <ConfigPanel config={formation.config} onChange={u => store.updateConfig(formation.id, u)}/>
          )}
        </div>
      </aside>

      {/* Wizard */}
      {showWizard && (
        <NewFormationWizard
          onConfirm={(name, scale, stage) => {
            store.createFormation(name, scale as ScaleMode, stage as StageMode);
            setShowWizard(false);
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

// ── Config panel ────────────────────────────────────────────
function ConfigPanel({ config, onChange }: { config: ProjectConfig; onChange: (u: Partial<ProjectConfig>) => void }) {
  return (
    <div className="space-y-4">
      {[
        { key: 'bpm' as const,             label: 'BPM',    min: 60,  max: 200, step: 1,
          fmt: (v: number) => String(v) },
        { key: 'durationSeconds' as const, label: '演舞時間', min: 30, max: 300, step: 10,
          fmt: (v: number) => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}` },
        { key: 'dancerCount' as const,     label: '人数',
          min: config.scale === 'small' ? 4 : 30,
          max: config.scale === 'small' ? 30 : 100,
          step: 1, fmt: (v: number) => `${v}人` },
      ].map(({ key, label, min, max, step, fmt }) => (
        <div key={key}>
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={min} max={max} step={step} value={config[key]}
              onChange={e => onChange({ [key]: Number(e.target.value) })}
              className="flex-1" style={{ accentColor: '#FF4D00' }}/>
            <span className="text-sm text-white/60 min-w-[40px] text-right tabular-nums">
              {fmt(config[key] as number)}
            </span>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-red-400/60 mt-1">⚠ 変更すると配置がリセットされます</p>
      <p className="text-[10px] text-white/20 pt-2 border-t border-white/5">
        構成タイプ・人数規模の変更は新規作成から行えます
      </p>
    </div>
  );
}
