import { useState, useRef, useCallback } from 'react';
import { useChecklistStore } from '../store/checklistStore';
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  RotateCcw, Save, FolderOpen, Check, Pencil, X,
  Package, Sparkles,
} from 'lucide-react';
import type { Category, CheckItem } from '../types';

// ─── Category icons picker ────────────────────────────────────
const ICON_OPTIONS = ['👘','🎒','📋','🥁','👟','🧴','💊','📱','💴','🏮','🎵','⭐','🔑','🧢','🌂'];

// ─── Helpers ─────────────────────────────────────────────────
function ProgressRing({ pct, size = 36, stroke = 3 }: { pct: number; size?: number; stroke?: number }) {
  const r   = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, pct);
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#FF4D00" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}/>
    </svg>
  );
}

// ─── Single check item row ────────────────────────────────────
function ItemRow({
  item, categoryId,
  onCheck, onUpdate, onRemove,
}: {
  item: CheckItem;
  categoryId: string;
  onCheck: (v: boolean) => void;
  onUpdate: (u: Partial<CheckItem>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(item.name);
  const [noteVal, setNoteVal] = useState(item.note);
  const [qtyVal,  setQtyVal]  = useState(String(item.quantity));

  const commitEdit = () => {
    onUpdate({
      name: nameVal.trim() || item.name,
      note: noteVal.trim(),
      quantity: Math.max(1, parseInt(qtyVal) || 1),
    });
    setEditing(false);
  };

  return (
    <div className={`group rounded-md transition-all border ${
      item.checked
        ? 'bg-white/3 border-white/4'
        : 'bg-white/5 border-white/8 hover:border-white/15'
    }`}>
      {!editing ? (
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Checkbox */}
          <button
            onClick={() => onCheck(!item.checked)}
            className={`shrink-0 w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all active:scale-90 ${
              item.checked
                ? 'bg-[#FF4D00] border-[#FF4D00]'
                : 'border-white/20 hover:border-[#FF4D00]/60 bg-white/5'
            }`}
          >
            {item.checked && <Check size={13} strokeWidth={3} className="text-white"/>}
          </button>

          {/* Name + note */}
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium transition-colors ${
              item.checked ? 'line-through text-white/30' : 'text-white/85'
            }`}>
              {item.name}
            </span>
            {item.note && (
              <p className="text-[10px] text-white/30 mt-0.5 truncate">{item.note}</p>
            )}
          </div>

          {/* Quantity badge */}
          {item.quantity > 1 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
              item.checked ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white/50'
            }`}>
              ×{item.quantity}
            </span>
          )}

          {/* Hover actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => { setNameVal(item.name); setNoteVal(item.note); setQtyVal(String(item.quantity)); setEditing(true); }}
              className="w-6 h-6 rounded-sm flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
              <Pencil size={11}/>
            </button>
            <button onClick={onRemove}
              className="w-6 h-6 rounded-sm flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <Trash2 size={11}/>
            </button>
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div className="px-3 py-2.5 space-y-2">
          <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
            placeholder="アイテム名"
            className="w-full bg-white/10 rounded-sm px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/50 placeholder-white/25"/>
          <div className="flex gap-2">
            <input value={noteVal} onChange={e => setNoteVal(e.target.value)}
              placeholder="メモ（任意）"
              className="flex-1 bg-white/8 rounded-sm px-3 py-1.5 text-xs text-white outline-none placeholder-white/20"/>
            <div className="flex items-center gap-1 bg-white/8 rounded-sm px-2">
              <span className="text-[10px] text-white/30">×</span>
              <input type="number" min="1" max="99" value={qtyVal}
                onChange={e => setQtyVal(e.target.value)}
                className="w-8 bg-transparent text-sm text-white text-center outline-none"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={commitEdit}
              className="flex-1 py-1.5 rounded-sm bg-[#FF4D00] text-white text-xs font-semibold hover:bg-[#E04500] transition-colors">
              保存
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-sm bg-white/8 text-white/50 text-xs hover:bg-white/15 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────
function CategoryCard({
  category,
  statsChecked, statsTotal,
  onCheckItem, onUpdateItem, onRemoveItem,
  onAddItem, onUpdateCategory, onRemoveCategory,
  onCheckAll, onUncheckAll,
}: {
  category: Category;
  statsChecked: number; statsTotal: number;
  onCheckItem: (itemId: string, v: boolean) => void;
  onUpdateItem: (itemId: string, u: Partial<CheckItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (name: string) => void;
  onUpdateCategory: (u: Partial<Pick<Category,'name'|'icon'>>) => void;
  onRemoveCategory: () => void;
  onCheckAll: () => void;
  onUncheckAll: () => void;
}) {
  const [open, setOpen]       = useState(true);
  const [addName, setAddName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(false);
  const [catName, setCatName] = useState(category.name);
  const [catIcon, setCatIcon] = useState(category.icon);
  const inputRef              = useRef<HTMLInputElement>(null);
  const pct = statsTotal > 0 ? statsChecked / statsTotal : 0;
  const allDone = statsTotal > 0 && statsChecked === statsTotal;

  const commitCatEdit = () => {
    onUpdateCategory({ name: catName.trim() || category.name, icon: catIcon });
    setEditCat(false);
  };

  const handleAddItem = () => {
    if (!addName.trim()) return;
    onAddItem(addName.trim());
    setAddName('');
    inputRef.current?.focus();
  };

  return (
    <div className={`rounded-md border overflow-hidden transition-all ${
      allDone ? 'border-[#FF4D00]/25 bg-[#FF4D00]/5' : 'border-white/8 bg-white/3'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon / ring */}
        <div className="relative shrink-0 cursor-pointer" onClick={() => setOpen(v => !v)}>
          <ProgressRing pct={pct} size={40} stroke={3}/>
          <span className="absolute inset-0 flex items-center justify-center text-lg leading-none select-none">
            {category.icon}
          </span>
        </div>

        {/* Title */}
        {editCat ? (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <input value={catName} onChange={e => setCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitCatEdit(); }}
                className="flex-1 bg-white/10 rounded-sm px-3 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/50"
                autoFocus/>
              <button onClick={commitCatEdit} className="px-2 py-1 rounded-sm bg-[#FF4D00] text-white text-xs">保存</button>
              <button onClick={() => setEditCat(false)} className="px-2 py-1 rounded-sm bg-white/8 text-white/40 text-xs">✕</button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => setCatIcon(ic)}
                  className={`w-8 h-8 rounded-sm text-lg flex items-center justify-center transition-all ${
                    catIcon === ic ? 'bg-[#FF4D00]/25 ring-1 ring-[#FF4D00]' : 'bg-white/5 hover:bg-white/15'
                  }`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setOpen(v => !v)} className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${allDone ? 'text-[#FF4D00]' : 'text-white'}`}>
                {category.name}
              </span>
              {allDone && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#FF4D00]/20 text-[#FF4D00] font-bold">
                  完了
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/30 mt-0.5">
              {statsChecked} / {statsTotal} 確認済み
            </p>
          </button>
        )}

        {!editCat && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Check all / uncheck all */}
            <button onClick={statsChecked < statsTotal ? onCheckAll : onUncheckAll}
              title={statsChecked < statsTotal ? 'すべてチェック' : 'すべて解除'}
              className="w-7 h-7 rounded-sm flex items-center justify-center text-white/30 hover:text-[#FF4D00] hover:bg-[#FF4D00]/10 transition-all text-xs">
              {statsChecked < statsTotal ? '✓' : '−'}
            </button>
            <button onClick={() => setEditCat(true)}
              className="w-7 h-7 rounded-sm flex items-center justify-center text-white/25 hover:text-white hover:bg-white/10 transition-all">
              <Pencil size={11}/>
            </button>
            <button onClick={onRemoveCategory}
              className="w-7 h-7 rounded-sm flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <Trash2 size={11}/>
            </button>
            <button onClick={() => setOpen(v => !v)}
              className="w-7 h-7 rounded-sm flex items-center justify-center text-white/30 hover:bg-white/10 transition-all">
              {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {category.items.length === 0 && (
            <p className="text-center text-white/20 text-xs py-3">アイテムがありません</p>
          )}
          {category.items.map(item => (
            <ItemRow key={item.id} item={item} categoryId={category.id}
              onCheck={v => onCheckItem(item.id, v)}
              onUpdate={u => onUpdateItem(item.id, u)}
              onRemove={() => onRemoveItem(item.id)}/>
          ))}

          {/* Add item */}
          {showAdd ? (
            <div className="flex gap-2 pt-1">
              <input
                ref={inputRef} autoFocus
                value={addName} onChange={e => setAddName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddItem();
                  if (e.key === 'Escape') { setShowAdd(false); setAddName(''); }
                }}
                placeholder="新しいアイテム名..."
                className="flex-1 bg-white/8 rounded-md px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/40 placeholder-white/20"/>
              <button onClick={handleAddItem}
                className="px-3 py-2 rounded-md bg-[#FF4D00] text-white text-xs font-semibold hover:bg-[#E04500] transition-colors">
                追加
              </button>
              <button onClick={() => { setShowAdd(false); setAddName(''); }}
                className="w-9 h-9 rounded-md bg-white/8 text-white/40 hover:bg-white/15 flex items-center justify-center transition-colors">
                <X size={14}/>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-white/10 text-white/30 hover:border-white/25 hover:text-white/60 text-xs transition-all">
              <Plus size={13}/>
              アイテムを追加
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function ChecklistPage() {
  const store = useChecklistStore();
  const stats = store.getStats();

  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📋');

  const totalPct = stats.total > 0 ? stats.checked / stats.total : 0;

  const handleReset = () => {
    store.resetChecks();
    setShowResetConfirm(false);
  };

  const handleSaveTemplate = () => {
    store.saveAsTemplate(templateName);
    setTemplateName('');
    setShowSaveModal(false);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    store.addCategory(newCatName.trim(), newCatIcon);
    setNewCatName('');
    setNewCatIcon('📋');
    setAddingCategory(false);
  };

  // ── Congratulation overlay ────────────────────────────────
  const allDone = stats.total > 0 && stats.checked === stats.total;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0A0A0C]">

      {/* ── Header / overall progress ──────────────────────── */}
      <div className="shrink-0 px-4 pt-5 pb-4 border-b border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold text-white">持ち物チェック</h1>
              {store.lastResetAt && (
                <p className="text-[10px] text-white/25 mt-0.5">
                  最終リセット: {new Date(store.lastResetAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTemplates(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  showTemplates
                    ? 'bg-white/15 border-white/25 text-white'
                    : 'bg-white/5 border-white/8 text-white/40 hover:bg-white/10 hover:text-white'
                }`}>
                <FolderOpen size={13}/>
                <span className="hidden sm:inline">テンプレート</span>
              </button>
              <button onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/8 text-white/40 hover:bg-white/10 hover:text-white text-xs font-medium transition-all">
                <Save size={13}/>
                <span className="hidden sm:inline">保存</span>
              </button>
              <button onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/8 text-white/40 hover:bg-orange-500/15 hover:text-orange-400 hover:border-orange-500/25 text-xs font-medium transition-all">
                <RotateCcw size={13}/>
                <span className="hidden sm:inline">リセット</span>
              </button>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/8 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${totalPct * 100}%`,
                  background: allDone ? '#1D9E75' : '#FF4D00',
                }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums shrink-0 ${allDone ? 'text-[#1D9E75]' : 'text-white/60'}`}>
              {stats.checked}/{stats.total}
            </span>
            <span className={`text-xs shrink-0 ${allDone ? 'text-[#1D9E75]' : 'text-white/30'}`}>
              {Math.round(totalPct * 100)}%
            </span>
          </div>

          {allDone && stats.total > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-[#1D9E75]/15 border border-[#1D9E75]/25">
              <Sparkles size={14} className="text-[#1D9E75] shrink-0"/>
              <p className="text-sm text-[#1D9E75] font-medium">すべての持ち物を確認しました！</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Template panel ─────────────────────────────────── */}
      {showTemplates && (
        <div className="shrink-0 border-b border-white/5 bg-white/2 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">保存済みテンプレート</p>
            {store.templates.length === 0 ? (
              <p className="text-xs text-white/25 py-2">テンプレートがありません。現在のリストを「保存」してテンプレートを作成できます。</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {store.templates.map(t => (
                  <div key={t.id} className="flex items-center gap-1.5 bg-white/8 rounded-md px-3 py-1.5 border border-white/8">
                    <button onClick={() => store.loadTemplate(t.id)}
                      className="text-xs text-white/70 hover:text-white transition-colors">
                      {t.name}
                    </button>
                    <button onClick={() => store.deleteTemplate(t.id)}
                      className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={10}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Category list ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {store.categories.map(cat => {
            const catStat = stats.byCategory.find(s => s.id === cat.id) ?? { checked: 0, total: 0 };
            return (
              <CategoryCard
                key={cat.id}
                category={cat}
                statsChecked={catStat.checked}
                statsTotal={catStat.total}
                onCheckItem={(itemId, v) => store.checkItem(cat.id, itemId, v)}
                onUpdateItem={(itemId, u) => store.updateItem(cat.id, itemId, u)}
                onRemoveItem={itemId => store.removeItem(cat.id, itemId)}
                onAddItem={name => store.addItem(cat.id, name)}
                onUpdateCategory={u => store.updateCategory(cat.id, u)}
                onRemoveCategory={() => store.removeCategory(cat.id)}
                onCheckAll={() => store.checkAll(cat.id)}
                onUncheckAll={() => store.uncheckAll(cat.id)}
              />
            );
          })}

          {/* Add category */}
          {addingCategory ? (
            <div className="rounded-md border border-[#FF4D00]/30 bg-[#FF4D00]/5 p-4 space-y-3">
              <p className="text-xs text-[#FF4D00] font-semibold uppercase tracking-widest">新しいカテゴリ</p>
              <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setAddingCategory(false); }}
                placeholder="カテゴリ名..."
                className="w-full bg-white/10 rounded-md px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/50 placeholder-white/25"/>
              <div className="flex gap-1.5 flex-wrap">
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} onClick={() => setNewCatIcon(ic)}
                    className={`w-9 h-9 rounded-md text-lg flex items-center justify-center transition-all ${
                      newCatIcon === ic ? 'bg-[#FF4D00]/25 ring-1 ring-[#FF4D00]' : 'bg-white/8 hover:bg-white/15'
                    }`}>
                    {ic}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCategory}
                  className="flex-1 py-2 rounded-md bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#E04500] transition-colors">
                  カテゴリを作成
                </button>
                <button onClick={() => setAddingCategory(false)}
                  className="px-4 py-2 rounded-md bg-white/8 text-white/50 text-sm hover:bg-white/15 transition-colors">
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-md border-2 border-dashed border-white/10 text-white/30 hover:border-[#FF4D00]/30 hover:text-[#FF4D00]/70 transition-all">
              <Package size={16}/>
              <span className="text-sm font-medium">カテゴリを追加</span>
            </button>
          )}

          {/* Bottom padding for mobile nav */}
          <div className="h-4"/>
        </div>
      </div>

      {/* ── Save as template modal ─────────────────────────── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1A1A1F] border border-white/10 rounded-md w-full max-w-sm p-5">
            <h3 className="text-base font-bold text-white mb-3">テンプレートとして保存</h3>
            <p className="text-xs text-white/40 mb-3">現在のアイテム構成をテンプレートに保存します。チェック状態は保存されません。</p>
            <input autoFocus value={templateName} onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); if (e.key === 'Escape') setShowSaveModal(false); }}
              placeholder={`テンプレート名（例: 本番用セット）`}
              className="w-full bg-white/8 rounded-md px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF4D00]/50 placeholder-white/25 mb-3"/>
            <div className="flex gap-2">
              <button onClick={handleSaveTemplate}
                className="flex-1 py-2.5 rounded-md bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#E04500] transition-colors">
                保存
              </button>
              <button onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 rounded-md bg-white/8 text-white/50 text-sm hover:bg-white/15 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset confirm modal ────────────────────────────── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1A1A1F] border border-white/10 rounded-md w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-sm bg-orange-500/15 flex items-center justify-center shrink-0">
                <RotateCcw size={18} className="text-orange-400"/>
              </div>
              <h3 className="text-base font-bold text-white">チェックをリセット</h3>
            </div>
            <p className="text-sm text-white/50 mb-4">
              すべてのチェックを外します。アイテムは削除されません。
            </p>
            <div className="flex gap-2">
              <button onClick={handleReset}
                className="flex-1 py-2.5 rounded-md bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors">
                リセットする
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-md bg-white/8 text-white/50 text-sm hover:bg-white/15 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
