// ─── Formation Editor Config ──────────────────────────────────
export type ScaleMode = 'small' | 'large';   // 4-30人 | 30-100人
export type StageMode = 'stage' | 'street';  // ステージ | ストリート/パレード

export interface ProjectConfig {
  scale: ScaleMode;
  stage: StageMode;
  dancerCount: number;   // 実際の人数
  bpm: number;           // 演舞BPM
  durationSeconds: number; // 演舞時間 (max 300s = 5min)
}

// キャンバス論理サイズ（モードで切替）
export const CANVAS_CONFIGS: Record<`${ScaleMode}_${StageMode}`, { w: number; h: number; dancerR: number; label: string }> = {
  small_stage:  { w: 800,  h: 500,  dancerR: 18, label: '少人数・ステージ' },
  small_street: { w: 500,  h: 900,  dancerR: 18, label: '少人数・ストリート' },
  large_stage:  { w: 1200, h: 700,  dancerR: 10, label: '大人数・ステージ' },
  large_street: { w: 700,  h: 1400, dancerR: 10, label: '大人数・ストリート' },
};

// ─── Formation ───────────────────────────────────────────────
export interface Dancer {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  number: number;
  groupId?: string;  // 大人数モード用グループ
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface DancerRoute {
  dancerId: string;
  points: RoutePoint[];
}

// 8カウント1ブロック
export interface CountBlock {
  id: string;
  index: number;       // 0-based block index
  label: string;       // "Aメロ 1" など
  snapshots: DancerSnapshot[]; // このブロック終了時点のダンサー位置
}

export interface DancerSnapshot {
  dancerId: string;
  x: number;
  y: number;
}

export interface DancerGroup {
  id: string;
  name: string;
  color: string;
  dancerIds: string[];
}

export interface Formation {
  id: string;
  name: string;
  section: string;
  config: ProjectConfig;
  dancers: Dancer[];
  groups: DancerGroup[];
  routes: DancerRoute[];
  timeline: CountBlock[];  // 8カウント単位のタイムライン
  activeBlockIndex: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Count Practice ──────────────────────────────────────────
export interface Count {
  number: number;
  memo: string;
  emphasis: boolean;
}

export interface PracticeSection {
  id: string;
  name: string;
  bpm: number;
  counts: Count[];
}

// ─── Music ───────────────────────────────────────────────────
export interface MusicLoop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  speed: number;
}

export interface MusicTrack {
  id: string;
  name: string;
  fileName: string;
  duration: number;
  loops: MusicLoop[];
  totalPlayCount: number;
}

// ─── Checklist ───────────────────────────────────────────────
export interface CheckItem {
  id: string;
  name: string;
  quantity: number;
  checked: boolean;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  items: CheckItem[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  categories: Category[];
}

// ─── Settings ────────────────────────────────────────────────
export interface AppSettings {
  teamName: string;
  theme: string;
  language: string;
  metronomeSound: string;
  hapticFeedback: boolean;
  autoSave: boolean;
}

export type ToolMode = 'select' | 'add' | 'route' | 'delete';
