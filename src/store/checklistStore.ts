import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CheckItem, Category, ChecklistTemplate } from '../types';

// ─── helpers ─────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 10); }

function makeItem(name: string, quantity = 1, note = ''): CheckItem {
  return { id: genId(), name, quantity, checked: false, note };
}

// ─── Default data ─────────────────────────────────────────────
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: genId(),
    name: '衣装',
    icon: '👘',
    items: [
      makeItem('鳴子', 2, '予備含む'),
      makeItem('法被（はっぴ）', 1),
      makeItem('衣装上下', 1),
      makeItem('足袋', 1, '替え含む'),
      makeItem('帯・たすき', 1),
      makeItem('扇子', 1),
    ],
  },
  {
    id: genId(),
    name: '小物・消耗品',
    icon: '🎒',
    items: [
      makeItem('タオル', 2),
      makeItem('水・スポーツドリンク', 2, '500ml以上'),
      makeItem('テーピング', 1, '足首・膝用'),
      makeItem('絆創膏', 1, '予備'),
      makeItem('日焼け止め', 1),
    ],
  },
  {
    id: genId(),
    name: 'その他',
    icon: '📋',
    items: [
      makeItem('参加証・当日プログラム', 1),
      makeItem('スマートフォン（充電済み）', 1),
      makeItem('現金・交通IC', 1),
    ],
  },
];

// ─── Store interface ──────────────────────────────────────────
interface ChecklistState {
  categories: Category[];
  templates: ChecklistTemplate[];
  lastResetAt: string | null;

  // Items
  checkItem(categoryId: string, itemId: string, checked: boolean): void;
  addItem(categoryId: string, name: string): void;
  updateItem(categoryId: string, itemId: string, updates: Partial<CheckItem>): void;
  removeItem(categoryId: string, itemId: string): void;
  reorderItem(categoryId: string, fromIndex: number, toIndex: number): void;

  // Categories
  addCategory(name: string, icon: string): void;
  updateCategory(categoryId: string, updates: Partial<Pick<Category, 'name' | 'icon'>>): void;
  removeCategory(categoryId: string): void;

  // Check management
  resetChecks(): void;
  checkAll(categoryId: string): void;
  uncheckAll(categoryId: string): void;

  // Templates
  saveAsTemplate(name: string): void;
  loadTemplate(templateId: string): void;
  deleteTemplate(templateId: string): void;

  // Stats
  getStats(): { total: number; checked: number; byCategory: { id: string; total: number; checked: number }[] };
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      templates: [],
      lastResetAt: null,

      // ── Items ───────────────────────────────────────────
      checkItem(categoryId, itemId, checked) {
        set(s => ({
          categories: s.categories.map(cat =>
            cat.id !== categoryId ? cat : {
              ...cat,
              items: cat.items.map(it => it.id === itemId ? { ...it, checked } : it),
            }
          ),
        }));
      },

      addItem(categoryId, name) {
        if (!name.trim()) return;
        const newItem = makeItem(name.trim());
        set(s => ({
          categories: s.categories.map(cat =>
            cat.id !== categoryId ? cat : { ...cat, items: [...cat.items, newItem] }
          ),
        }));
      },

      updateItem(categoryId, itemId, updates) {
        set(s => ({
          categories: s.categories.map(cat =>
            cat.id !== categoryId ? cat : {
              ...cat,
              items: cat.items.map(it => it.id === itemId ? { ...it, ...updates } : it),
            }
          ),
        }));
      },

      removeItem(categoryId, itemId) {
        set(s => ({
          categories: s.categories.map(cat =>
            cat.id !== categoryId ? cat : { ...cat, items: cat.items.filter(it => it.id !== itemId) }
          ),
        }));
      },

      reorderItem(categoryId, fromIndex, toIndex) {
        set(s => ({
          categories: s.categories.map(cat => {
            if (cat.id !== categoryId) return cat;
            const items = [...cat.items];
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            return { ...cat, items };
          }),
        }));
      },

      // ── Categories ──────────────────────────────────────
      addCategory(name, icon) {
        set(s => ({
          categories: [...s.categories, { id: genId(), name: name.trim() || '新カテゴリ', icon, items: [] }],
        }));
      },

      updateCategory(categoryId, updates) {
        set(s => ({
          categories: s.categories.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat),
        }));
      },

      removeCategory(categoryId) {
        set(s => ({ categories: s.categories.filter(cat => cat.id !== categoryId) }));
      },

      // ── Check management ────────────────────────────────
      resetChecks() {
        set(s => ({
          categories: s.categories.map(cat => ({
            ...cat,
            items: cat.items.map(it => ({ ...it, checked: false })),
          })),
          lastResetAt: new Date().toISOString(),
        }));
      },

      checkAll(categoryId) {
        set(s => ({
          categories: s.categories.map(cat =>
            cat.id !== categoryId ? cat : {
              ...cat, items: cat.items.map(it => ({ ...it, checked: true })),
            }
          ),
        }));
      },

      uncheckAll(categoryId) {
        set(s => ({
          categories: s.categories.map(cat =>
            cat.id !== categoryId ? cat : {
              ...cat, items: cat.items.map(it => ({ ...it, checked: false })),
            }
          ),
        }));
      },

      // ── Templates ───────────────────────────────────────
      saveAsTemplate(name) {
        const { categories } = get();
        const template: ChecklistTemplate = {
          id: genId(),
          name: name.trim() || `テンプレート ${new Date().toLocaleDateString('ja-JP')}`,
          // Strip checked state for templates
          categories: categories.map(cat => ({
            ...cat,
            items: cat.items.map(it => ({ ...it, checked: false })),
          })),
        };
        set(s => ({ templates: [...s.templates, template] }));
      },

      loadTemplate(templateId) {
        const { templates } = get();
        const tmpl = templates.find(t => t.id === templateId);
        if (!tmpl) return;
        // Give new IDs so edits don't affect the template
        set({
          categories: tmpl.categories.map(cat => ({
            ...cat,
            id: genId(),
            items: cat.items.map(it => ({ ...it, id: genId(), checked: false })),
          })),
        });
      },

      deleteTemplate(templateId) {
        set(s => ({ templates: s.templates.filter(t => t.id !== templateId) }));
      },

      // ── Stats ────────────────────────────────────────────
      getStats() {
        const { categories } = get();
        let total = 0, checked = 0;
        const byCategory = categories.map(cat => {
          const t = cat.items.length;
          const c = cat.items.filter(it => it.checked).length;
          total += t; checked += c;
          return { id: cat.id, total: t, checked: c };
        });
        return { total, checked, byCategory };
      },
    }),
    { name: 'yosakoi-checklist-v1' }
  )
);
