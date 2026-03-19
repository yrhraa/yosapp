import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Formation, Dancer, DancerRoute, DancerGroup,
  CountBlock, DancerSnapshot, ProjectConfig,
} from '../types';

// ─── Constants ───────────────────────────────────────────────
export const DANCER_COLORS = [
  '#FF4D00','#1D9E75','#185FA5','#BA7517','#D4537E','#534AB7',
  '#3B6D11','#A32D2D','#0F6E56','#993C1D','#3C3489','#5F5E5A',
  '#FF4D00','#1D9E75','#185FA5','#BA7517','#D4537E','#534AB7',
  '#3B6D11','#A32D2D',
];
export const GROUP_COLORS = ['#FF4D00','#1D9E75','#185FA5','#BA7517','#D4537E','#534AB7'];
export const MAX_DURATION_SEC = 300;
export const COUNTS_PER_BLOCK = 8;

// ─── Helpers ─────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 10); }

export function getCanvasSizeFor(config: ProjectConfig) {
  const MAP: Record<string, { w: number; h: number }> = {
    small_stage:  { w: 800,  h: 500  },
    small_street: { w: 500,  h: 900  },
    large_stage:  { w: 1200, h: 700  },
    large_street: { w: 700,  h: 1400 },
  };
  return MAP[`${config.scale}_${config.stage}`] ?? { w: 800, h: 500 };
}

export function getDancerRadius(config: ProjectConfig) {
  return config.scale === 'large' ? 8 : 18;
}

function calcBlockCount(bpm: number, durationSec: number) {
  const secPerBlock = (60 / bpm) * COUNTS_PER_BLOCK;
  return Math.max(1, Math.ceil(durationSec / secPerBlock));
}

function makeTimeline(bpm: number, durationSec: number, dancers: Dancer[]): CountBlock[] {
  return Array.from({ length: calcBlockCount(bpm, durationSec) }, (_, i) => ({
    id: genId(),
    index: i,
    label: `ブロック ${i + 1}`,
    snapshots: dancers.map(d => ({ dancerId: d.id, x: d.x, y: d.y })),
  }));
}

function makeDefaultConfig(
  scale: ProjectConfig['scale'],
  stage: ProjectConfig['stage'],
): ProjectConfig {
  return { scale, stage, dancerCount: scale === 'small' ? 8 : 32, bpm: 120, durationSeconds: 120 };
}

function makeDefaultDancers(config: ProjectConfig, canvasW: number, canvasH: number): Dancer[] {
  const count = config.dancerCount;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const padX = canvasW * 0.15;
  const padY = canvasH * 0.2;
  const stepX = (canvasW - padX * 2) / Math.max(cols - 1, 1);
  const stepY = (canvasH - padY * 2) / Math.max(rows - 1, 1);
  return Array.from({ length: count }, (_, i) => ({
    id: genId(),
    name: String(i + 1),
    x: Math.round(padX + (i % cols) * stepX),
    y: Math.round(padY + Math.floor(i / cols) * stepY),
    color: DANCER_COLORS[i % DANCER_COLORS.length],
    number: i + 1,
  }));
}

function applySnapshot(dancers: Dancer[], snapshots: DancerSnapshot[]): Dancer[] {
  const map = new Map(snapshots.map(s => [s.dancerId, s]));
  return dancers.map(d => { const s = map.get(d.id); return s ? { ...d, x: s.x, y: s.y } : d; });
}

function makeNewFormation(
  name: string,
  scale: ProjectConfig['scale'],
  stage: ProjectConfig['stage'],
): Formation {
  const now = new Date().toISOString();
  const config = makeDefaultConfig(scale, stage);
  const canvas = getCanvasSizeFor(config);
  const dancers = makeDefaultDancers(config, canvas.w, canvas.h);
  return {
    id: genId(), name, section: 'A', config,
    dancers, groups: [], routes: [],
    timeline: makeTimeline(config.bpm, config.durationSeconds, dancers),
    activeBlockIndex: 0,
    createdAt: now, updatedAt: now,
  };
}

// ─── Store Interface ──────────────────────────────────────────
interface FormationState {
  formations: Formation[];
  activeFormationId: string | null;

  createFormation(name: string, scale: ProjectConfig['scale'], stage: ProjectConfig['stage']): Formation;
  deleteFormation(id: string): void;
  duplicateFormation(id: string): void;
  setActiveFormation(id: string): void;
  getActiveFormation(): Formation | null;
  updateFormationName(id: string, name: string): void;
  updateConfig(formationId: string, updates: Partial<ProjectConfig>): void;

  addDancer(formationId: string, x: number, y: number): void;
  addDancersBulk(formationId: string, count: number): void;
  updateDancer(formationId: string, dancerId: string, updates: Partial<Dancer>): void;
  deleteDancer(formationId: string, dancerId: string): void;

  createGroup(formationId: string, name: string, color: string): void;
  assignDancersToGroup(formationId: string, dancerIds: string[], groupId: string | null): void;
  deleteGroup(formationId: string, groupId: string): void;

  addRoutePoint(formationId: string, dancerId: string, x: number, y: number): void;
  clearRoutes(formationId: string, dancerId?: string): void;

  setActiveBlock(formationId: string, index: number): void;
  saveSnapshot(formationId: string): void;
  addBlock(formationId: string): void;
  removeBlock(formationId: string, index: number): void;
  relabelBlock(formationId: string, index: number, label: string): void;
  jumpToBlock(formationId: string, index: number): void;
}

// ─── Store ───────────────────────────────────────────────────
export const useFormationStore = create<FormationState>()(
  persist(
    (set, get) => {
      const initial = makeNewFormation('フォーメーション 1', 'small', 'stage');
      return {
        formations: [initial],
        activeFormationId: initial.id,

        createFormation(name, scale, stage) {
          const f = makeNewFormation(name, scale, stage);
          set(s => ({ formations: [...s.formations, f], activeFormationId: f.id }));
          return f;
        },

        deleteFormation(id) {
          set(s => {
            const formations = s.formations.filter(f => f.id !== id);
            return {
              formations,
              activeFormationId: s.activeFormationId === id ? (formations[0]?.id ?? null) : s.activeFormationId,
            };
          });
        },

        duplicateFormation(id) {
          const orig = get().formations.find(f => f.id === id);
          if (!orig) return;
          const now = new Date().toISOString();
          const idMap: Record<string, string> = {};
          const dancers = orig.dancers.map(d => { const nid = genId(); idMap[d.id] = nid; return { ...d, id: nid }; });
          const copy: Formation = {
            ...JSON.parse(JSON.stringify(orig)),
            id: genId(),
            name: orig.name + ' (コピー)',
            dancers,
            routes: orig.routes.map(r => ({ ...r, dancerId: idMap[r.dancerId] ?? r.dancerId })),
            timeline: orig.timeline.map(b => ({
              ...b, id: genId(),
              snapshots: b.snapshots.map(s => ({ ...s, dancerId: idMap[s.dancerId] ?? s.dancerId })),
            })),
            createdAt: now, updatedAt: now,
          };
          set(s => ({ formations: [...s.formations, copy], activeFormationId: copy.id }));
        },

        setActiveFormation(id) { set({ activeFormationId: id }); },

        getActiveFormation() {
          const { formations, activeFormationId } = get();
          return formations.find(f => f.id === activeFormationId) ?? null;
        },

        updateFormationName(id, name) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f
            ),
          }));
        },

        updateConfig(formationId, updates) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const config = { ...f.config, ...updates };
              const canvas = getCanvasSizeFor(config);
              const needRebuildDancers = updates.dancerCount !== undefined && updates.dancerCount !== f.config.dancerCount;
              const dancers = needRebuildDancers ? makeDefaultDancers(config, canvas.w, canvas.h) : f.dancers;
              const needRebuildTimeline = updates.bpm !== undefined || updates.durationSeconds !== undefined;
              const timeline = needRebuildTimeline ? makeTimeline(config.bpm, config.durationSeconds, dancers) : f.timeline;
              return { ...f, config, dancers, timeline, activeBlockIndex: 0, updatedAt: new Date().toISOString() };
            }),
          }));
        },

        addDancer(formationId, x, y) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const num = f.dancers.length + 1;
              const dancer: Dancer = {
                id: genId(), name: String(num), x, y,
                color: DANCER_COLORS[(num - 1) % DANCER_COLORS.length], number: num,
              };
              return { ...f, dancers: [...f.dancers, dancer], updatedAt: new Date().toISOString() };
            }),
          }));
        },

        addDancersBulk(formationId, count) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const canvas = getCanvasSizeFor(f.config);
              const newDancers: Dancer[] = Array.from({ length: count }, (_, i) => {
                const num = f.dancers.length + i + 1;
                return {
                  id: genId(), name: String(num),
                  x: Math.round(80 + Math.random() * (canvas.w - 160)),
                  y: Math.round(80 + Math.random() * (canvas.h - 160)),
                  color: DANCER_COLORS[(num - 1) % DANCER_COLORS.length], number: num,
                };
              });
              return { ...f, dancers: [...f.dancers, ...newDancers], updatedAt: new Date().toISOString() };
            }),
          }));
        },

        updateDancer(formationId, dancerId, updates) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id !== formationId ? f : {
                ...f,
                dancers: f.dancers.map(d => d.id === dancerId ? { ...d, ...updates } : d),
                updatedAt: new Date().toISOString(),
              }
            ),
          }));
        },

        deleteDancer(formationId, dancerId) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id !== formationId ? f : {
                ...f,
                dancers: f.dancers.filter(d => d.id !== dancerId),
                routes: f.routes.filter(r => r.dancerId !== dancerId),
                groups: f.groups.map(g => ({ ...g, dancerIds: g.dancerIds.filter(id => id !== dancerId) })),
                updatedAt: new Date().toISOString(),
              }
            ),
          }));
        },

        createGroup(formationId, name, color) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id !== formationId ? f : {
                ...f,
                groups: [...f.groups, { id: genId(), name, color, dancerIds: [] }],
                updatedAt: new Date().toISOString(),
              }
            ),
          }));
        },

        assignDancersToGroup(formationId, dancerIds, groupId) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const groups: DancerGroup[] = f.groups.map(g => {
                if (g.id === groupId) return { ...g, dancerIds: [...new Set([...g.dancerIds, ...dancerIds])] };
                return { ...g, dancerIds: g.dancerIds.filter(id => !dancerIds.includes(id)) };
              });
              const dancers = f.dancers.map(d =>
                dancerIds.includes(d.id) ? { ...d, groupId: groupId ?? undefined } : d
              );
              return { ...f, groups, dancers, updatedAt: new Date().toISOString() };
            }),
          }));
        },

        deleteGroup(formationId, groupId) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id !== formationId ? f : {
                ...f,
                groups: f.groups.filter(g => g.id !== groupId),
                dancers: f.dancers.map(d => d.groupId === groupId ? { ...d, groupId: undefined } : d),
                updatedAt: new Date().toISOString(),
              }
            ),
          }));
        },

        addRoutePoint(formationId, dancerId, x, y) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const dancer = f.dancers.find(d => d.id === dancerId);
              if (!dancer) return f;
              const existing = f.routes.find(r => r.dancerId === dancerId);
              const routes: DancerRoute[] = existing
                ? f.routes.map(r => r.dancerId === dancerId ? { ...r, points: [...r.points, { x, y }] } : r)
                : [...f.routes, { dancerId, points: [{ x: dancer.x, y: dancer.y }, { x, y }] }];
              return { ...f, routes, updatedAt: new Date().toISOString() };
            }),
          }));
        },

        clearRoutes(formationId, dancerId) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id !== formationId ? f : {
                ...f,
                routes: dancerId ? f.routes.filter(r => r.dancerId !== dancerId) : [],
                updatedAt: new Date().toISOString(),
              }
            ),
          }));
        },

        setActiveBlock(formationId, index) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id === formationId ? { ...f, activeBlockIndex: index } : f
            ),
          }));
        },

        saveSnapshot(formationId) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const snapshots: DancerSnapshot[] = f.dancers.map(d => ({ dancerId: d.id, x: d.x, y: d.y }));
              const timeline = f.timeline.map((b, i) =>
                i === f.activeBlockIndex ? { ...b, snapshots } : b
              );
              return { ...f, timeline, updatedAt: new Date().toISOString() };
            }),
          }));
        },

        addBlock(formationId) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              if (f.timeline.length >= calcBlockCount(f.config.bpm, MAX_DURATION_SEC)) return f;
              const block: CountBlock = {
                id: genId(),
                index: f.timeline.length,
                label: `ブロック ${f.timeline.length + 1}`,
                snapshots: f.dancers.map(d => ({ dancerId: d.id, x: d.x, y: d.y })),
              };
              return { ...f, timeline: [...f.timeline, block], updatedAt: new Date().toISOString() };
            }),
          }));
        },

        removeBlock(formationId, index) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId || f.timeline.length <= 1) return f;
              const timeline = f.timeline.filter((_, i) => i !== index).map((b, i) => ({ ...b, index: i }));
              return {
                ...f, timeline,
                activeBlockIndex: Math.min(f.activeBlockIndex, timeline.length - 1),
                updatedAt: new Date().toISOString(),
              };
            }),
          }));
        },

        relabelBlock(formationId, index, label) {
          set(s => ({
            formations: s.formations.map(f =>
              f.id !== formationId ? f : {
                ...f,
                timeline: f.timeline.map((b, i) => i === index ? { ...b, label } : b),
                updatedAt: new Date().toISOString(),
              }
            ),
          }));
        },

        jumpToBlock(formationId, index) {
          set(s => ({
            formations: s.formations.map(f => {
              if (f.id !== formationId) return f;
              const block = f.timeline[index];
              if (!block) return f;
              return {
                ...f,
                dancers: applySnapshot(f.dancers, block.snapshots),
                activeBlockIndex: index,
                updatedAt: new Date().toISOString(),
              };
            }),
          }));
        },
      };
    },
    { name: 'yosakoi-formations-v2' }
  )
);
