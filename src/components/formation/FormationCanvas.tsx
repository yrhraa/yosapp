import { useRef, useState, useCallback, useEffect } from 'react';
import type { Formation, Dancer, DancerGroup, ToolMode } from '../../types';
import { getCanvasSizeFor, getDancerRadius } from '../../store/formationStore';

interface Props {
  formation: Formation;
  tool: ToolMode;
  selectedIds: Set<string>;
  onSelect: (id: string, multi?: boolean) => void;
  onClearSelection: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveGroup: (ids: string[], dx: number, dy: number) => void;
  onAdd: (x: number, y: number) => void;
  onAddRoutePoint: (dancerId: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  routingId: string | null;
  onSetRoutingId: (id: string | null) => void;
  /** スマホ簡易モード: select固定 + タッチドラッグのみ */
  simpleMode?: boolean;
}

const AUDIENCE_LABEL = 'お客さん側 ▲';
const STREET_LABEL   = '▲ 進行方向';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function angle(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI) + 90; }

export default function FormationCanvas({
  formation, tool, selectedIds,
  onSelect, onClearSelection, onMove, onMoveGroup,
  onAdd, onAddRoutePoint, onDelete,
  routingId, onSetRoutingId,
  simpleMode = false,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { w: STAGE_W, h: STAGE_H } = getCanvasSizeFor(formation.config);
  const R       = getDancerRadius(formation.config);
  const isLarge = formation.config.scale === 'large';
  const isStreet = formation.config.stage === 'street';

  /* ── drag / lasso state ──────────────────────────────────── */
  type DragState = {
    ids: string[];
    startX: number; startY: number;
    startPositions: Map<string, { x: number; y: number }>;
    moved: boolean;
  };
  const dragRef        = useRef<DragState | null>(null);
  const touchIdRef     = useRef<number | null>(null);  // active touch identifier
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [lasso, setLasso] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const lassoStartRef  = useRef<{ x: number; y: number } | null>(null);

  /* ── coordinate helpers ──────────────────────────────────── */
  const toSVG = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.round((clientX - rect.left) * (STAGE_W / rect.width)),
      y: Math.round((clientY - rect.top)  * (STAGE_H / rect.height)),
    };
  }, [STAGE_W, STAGE_H]);

  const groupColorOf = useCallback((dancer: Dancer) => {
    if (!dancer.groupId) return dancer.color;
    const g = formation.groups.find((gr: DancerGroup) => gr.id === dancer.groupId);
    return g?.color ?? dancer.color;
  }, [formation.groups]);

  /* ── shared move logic ───────────────────────────────────── */
  const applyDrag = useCallback((ptX: number, ptY: number) => {
    const dr = dragRef.current;
    if (!dr) return;
    dr.moved = true;
    const dx = ptX - dr.startX;
    const dy = ptY - dr.startY;
    const { ids } = dr;
    if (ids.length === 1) {
      const base = dr.startPositions.get(ids[0])!;
      onMove(ids[0], clamp(base.x + dx, R, STAGE_W - R), clamp(base.y + dy, R, STAGE_H - R));
    } else {
      onMoveGroup(ids, dx, dy);
      // reset accumulation
      dr.startX = ptX; dr.startY = ptY;
      dr.startPositions = new Map(
        formation.dancers.filter(d => ids.includes(d.id)).map(d => [d.id, { x: d.x, y: d.y }])
      );
    }
  }, [onMove, onMoveGroup, formation.dancers, R, STAGE_W, STAGE_H]);

  /* ── MOUSE global listeners ──────────────────────────────── */
  useEffect(() => {
    const onMove_ = (e: MouseEvent) => {
      if (dragRef.current) { const pt = toSVG(e.clientX, e.clientY); applyDrag(pt.x, pt.y); return; }
      if (lassoStartRef.current) {
        const pt = toSVG(e.clientX, e.clientY);
        setLasso({ x0: lassoStartRef.current.x, y0: lassoStartRef.current.y, x1: pt.x, y1: pt.y });
        return;
      }
      if (tool === 'route' && routingId) setHoverPos(toSVG(e.clientX, e.clientY));
    };
    const onUp_ = () => {
      if (lassoStartRef.current && lasso) finishLasso();
      lassoStartRef.current = null;
      setLasso(null);
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove_);
    window.addEventListener('mouseup', onUp_);
    return () => { window.removeEventListener('mousemove', onMove_); window.removeEventListener('mouseup', onUp_); };
  }, [applyDrag, toSVG, tool, routingId, lasso]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── TOUCH global listeners ──────────────────────────────── */
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const touch = [...e.changedTouches].find(t => t.identifier === touchIdRef.current);
      if (!touch || !dragRef.current) return;
      e.preventDefault();
      const pt = toSVG(touch.clientX, touch.clientY);
      applyDrag(pt.x, pt.y);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const touch = [...e.changedTouches].find(t => t.identifier === touchIdRef.current);
      if (!touch) return;
      touchIdRef.current = null;
      dragRef.current = null;
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [applyDrag, toSVG]);

  /* ── lasso finish ────────────────────────────────────────── */
  const finishLasso = useCallback(() => {
    if (!lasso) return;
    const minX = Math.min(lasso.x0, lasso.x1), maxX = Math.max(lasso.x0, lasso.x1);
    const minY = Math.min(lasso.y0, lasso.y1), maxY = Math.max(lasso.y0, lasso.y1);
    if (maxX - minX > 6 || maxY - minY > 6) {
      formation.dancers.forEach(d => {
        if (d.x >= minX && d.x <= maxX && d.y >= minY && d.y <= maxY) onSelect(d.id, true);
      });
    }
  }, [lasso, formation.dancers, onSelect]);

  /* ── background click/down ───────────────────────────────── */
  const handleBgClick = (e: React.MouseEvent) => {
    const isBg = (e.target as SVGElement).classList.contains('stage-bg') || e.target === svgRef.current;
    if (!isBg) return;
    if (simpleMode) { onClearSelection(); return; }
    const pt = toSVG(e.clientX, e.clientY);
    if (tool === 'add')   { onAdd(pt.x, pt.y); return; }
    if (tool === 'route' && routingId) { onAddRoutePoint(routingId, pt.x, pt.y); return; }
    onClearSelection(); onSetRoutingId(null); setHoverPos(null);
  };

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (simpleMode || tool !== 'select') return;
    const isBg = (e.target as SVGElement).classList.contains('stage-bg') || e.target === svgRef.current;
    if (!isBg) return;
    const pt = toSVG(e.clientX, e.clientY);
    lassoStartRef.current = pt;
    setLasso({ x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y });
  };

  /* ── bg touch (tap to add in add mode) ──────────────────── */
  const handleBgTouchStart = (e: React.TouchEvent) => {
    const isBg = (e.target as SVGElement).classList.contains('stage-bg') || e.target === svgRef.current;
    if (!isBg) return;
    if (simpleMode) { onClearSelection(); return; }
    if (tool === 'add') {
      const touch = e.changedTouches[0];
      const pt = toSVG(touch.clientX, touch.clientY);
      onAdd(pt.x, pt.y);
    }
  };

  /* ── dancer mouse down ───────────────────────────────────── */
  const handleDancerMouseDown = (e: React.MouseEvent, dancer: Dancer) => {
    e.stopPropagation();
    if (simpleMode) {
      onSelect(dancer.id);
      const pt = toSVG(e.clientX, e.clientY);
      dragRef.current = {
        ids: [dancer.id], startX: pt.x, startY: pt.y,
        startPositions: new Map([[dancer.id, { x: dancer.x, y: dancer.y }]]),
        moved: false,
      };
      return;
    }
    if (tool === 'delete') { onDelete(dancer.id); return; }
    if (tool === 'route') {
      routingId === dancer.id ? (onSetRoutingId(null), setHoverPos(null)) : (onSetRoutingId(dancer.id), onSelect(dancer.id));
      return;
    }
    if (tool === 'select') {
      const multi = e.shiftKey || e.metaKey || e.ctrlKey;
      onSelect(dancer.id, multi);
      const ids = (selectedIds.size > 1 && selectedIds.has(dancer.id)) ? [...selectedIds] : [dancer.id];
      const pt = toSVG(e.clientX, e.clientY);
      dragRef.current = {
        ids, startX: pt.x, startY: pt.y,
        startPositions: new Map(formation.dancers.filter(d => ids.includes(d.id)).map(d => [d.id, { x: d.x, y: d.y }])),
        moved: false,
      };
    }
  };

  /* ── dancer touch start ──────────────────────────────────── */
  const handleDancerTouchStart = (e: React.TouchEvent, dancer: Dancer) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    onSelect(dancer.id);
    const pt = toSVG(touch.clientX, touch.clientY);
    dragRef.current = {
      ids: [dancer.id], startX: pt.x, startY: pt.y,
      startPositions: new Map([[dancer.id, { x: dancer.x, y: dancer.y }]]),
      moved: false,
    };
  };

  const effectiveTool = simpleMode ? 'select' : tool;
  const cursorMap: Record<ToolMode, string> = {
    select: 'default', add: 'crosshair', route: routingId ? 'cell' : 'default', delete: 'no-drop',
  };

  const lastRoutePoint = routingId
    ? (() => {
        const route  = formation.routes.find(r => r.dancerId === routingId);
        const dancer = formation.dancers.find(d => d.id === routingId);
        return route?.points.at(-1) ?? (dancer ? { x: dancer.x, y: dancer.y } : null);
      })()
    : null;

  return (
    <div className="relative w-full overflow-auto rounded-md border border-white/8 bg-[#0F0F12]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        style={{ width: '100%', maxWidth: STAGE_W, display: 'block',
          cursor: cursorMap[effectiveTool], touchAction: 'none', userSelect: 'none' }}
        onClick={handleBgClick}
        onMouseDown={handleBgMouseDown}
        onTouchStart={handleBgTouchStart}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          </pattern>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>

        <rect className="stage-bg" x="0" y="0" width={STAGE_W} height={STAGE_H} fill="url(#grid)"/>

        {isStreet ? (
          <>
            <rect x="0" y="0" width={STAGE_W} height="30" fill="rgba(255,77,0,0.12)"/>
            <text x={STAGE_W/2} y="19" textAnchor="middle" fontSize="11" fill="rgba(255,77,0,0.7)" fontFamily="'Noto Sans JP',sans-serif">{STREET_LABEL}</text>
            {[0.25,0.5,0.75].map(f => (
              <line key={f} x1={STAGE_W*f} y1="30" x2={STAGE_W*f} y2={STAGE_H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="6 6"/>
            ))}
          </>
        ) : (
          <>
            <rect x="0" y="0" width={STAGE_W} height="28" fill="rgba(255,77,0,0.12)"/>
            <text x={STAGE_W/2} y="18" textAnchor="middle" fontSize="11" fill="rgba(255,77,0,0.7)" fontFamily="'Noto Sans JP',sans-serif">{AUDIENCE_LABEL}</text>
            <line x1="20" y1="35" x2={STAGE_W-20} y2="35" stroke="rgba(255,77,0,0.25)" strokeWidth="1" strokeDasharray="6 4"/>
            <line x1={STAGE_W/2} y1="40" x2={STAGE_W/2} y2={STAGE_H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 8"/>
          </>
        )}

        {/* Routes */}
        {formation.routes.map(route => {
          const dancer = formation.dancers.find(d => d.id === route.dancerId);
          if (!dancer || route.points.length < 2) return null;
          const pts = route.points;
          const color = groupColorOf(dancer);
          return (
            <g key={route.dancerId}>
              <path
                d={pts.map((p,i) => `${i===0?'M':'L'}${p.x} ${p.y}`).join(' ')}
                fill="none" stroke={color} strokeWidth={isLarge?1.2:2}
                strokeDasharray="6 3" opacity="0.65" markerEnd="url(#arr)"
              />
              {pts.slice(1).map((p,i) => (
                <polygon key={i} points="0,-5 4.5,3.5 -4.5,3.5" fill={color} opacity="0.75"
                  transform={`translate(${p.x},${p.y}) rotate(${angle(pts[i],p)})`}/>
              ))}
            </g>
          );
        })}

        {/* Route preview */}
        {routingId && hoverPos && lastRoutePoint && (() => {
          const dancer = formation.dancers.find(d => d.id === routingId);
          if (!dancer) return null;
          return <line x1={lastRoutePoint.x} y1={lastRoutePoint.y} x2={hoverPos.x} y2={hoverPos.y}
            stroke={groupColorOf(dancer)} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"/>;
        })()}

        {/* Lasso */}
        {lasso && (
          <rect x={Math.min(lasso.x0,lasso.x1)} y={Math.min(lasso.y0,lasso.y1)}
            width={Math.abs(lasso.x1-lasso.x0)} height={Math.abs(lasso.y1-lasso.y0)}
            fill="rgba(255,77,0,0.08)" stroke="rgba(255,77,0,0.5)" strokeWidth="1" strokeDasharray="4 3"/>
        )}

        {/* Dancers */}
        {formation.dancers.map(dancer => {
          const isSelected = selectedIds.has(dancer.id);
          const isRouting  = dancer.id === routingId;
          const color      = groupColorOf(dancer);
          const touchR     = simpleMode ? Math.max(R, 22) : R; // larger hit area on mobile
          return (
            <g key={dancer.id}
              transform={`translate(${dancer.x},${dancer.y})`}
              style={{ cursor: effectiveTool === 'delete' ? 'no-drop' : 'grab' }}
              onMouseDown={e => handleDancerMouseDown(e, dancer)}
              onTouchStart={e => handleDancerTouchStart(e, dancer)}
            >
              {/* Transparent larger touch target on mobile */}
              {simpleMode && <circle r={touchR} fill="transparent"/>}
              {(isSelected || isRouting) && (
                <circle r={R+(isLarge?4:7)} fill="none" stroke={color}
                  strokeWidth={isLarge?1:1.5} strokeDasharray={isRouting?'3 2':'none'} opacity="0.7"/>
              )}
              {!isLarge && <ellipse cx="0" cy={R+2} rx={R-4} ry="3" fill="rgba(0,0,0,0.35)"/>}
              <circle r={R} fill={color} opacity={isSelected?1:0.85}/>
              <circle r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              <text textAnchor="middle" dominantBaseline="central"
                fontSize={isLarge?6:(dancer.name.length>2?8:11)}
                fontWeight="700" fill="white" fontFamily="'Noto Sans JP',sans-serif"
                style={{ pointerEvents:'none', userSelect:'none' }}>
                {dancer.name}
              </text>
            </g>
          );
        })}

        {tool === 'add' && !simpleMode && formation.dancers.length === 0 && (
          <text x={STAGE_W/2} y={STAGE_H/2} textAnchor="middle" fontSize="13"
            fill="rgba(255,255,255,0.15)" fontFamily="'Noto Sans JP',sans-serif">
            タップしてダンサーを追加
          </text>
        )}
      </svg>
    </div>
  );
}
