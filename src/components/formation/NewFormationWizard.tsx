import { useState } from 'react';
import { X, Users, Music2, MapPin, Clapperboard } from 'lucide-react';
import type { ScaleMode, StageMode } from '../../types';

interface Props {
  onConfirm: (name: string, scale: ScaleMode, stage: StageMode) => void;
  onCancel: () => void;
}

const SCALE_OPTIONS: { value: ScaleMode; label: string; sub: string; range: string; icon: React.ReactNode }[] = [
  {
    value: 'small',
    label: '少人数構成',
    sub: 'コンパクトなチーム向け',
    range: '4〜30人',
    icon: <Users size={22} />,
  },
  {
    value: 'large',
    label: '大人数構成',
    sub: '迫力ある大型演舞向け',
    range: '30〜100人',
    icon: <Users size={22} />,
  },
];

const STAGE_OPTIONS: { value: StageMode; label: string; sub: string; shape: string; icon: React.ReactNode }[] = [
  {
    value: 'stage',
    label: 'ステージ構成',
    sub: '固定舞台・正面客席',
    shape: '横長キャンバス',
    icon: <Clapperboard size={22} />,
  },
  {
    value: 'street',
    label: 'ストリート / パレード',
    sub: '移動しながらの演舞',
    shape: '縦長キャンバス',
    icon: <MapPin size={22} />,
  },
];

export default function NewFormationWizard({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');
  const [scale, setScale] = useState<ScaleMode>('small');
  const [stage, setStage] = useState<StageMode>('stage');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const canNext1 = name.trim().length > 0;
  const preview = SCALE_OPTIONS.find(o => o.value === scale)!;
  const stagePreview = STAGE_OPTIONS.find(o => o.value === stage)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#141417] border border-white/10 rounded-md w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">
              新規フォーメーション — STEP {step} / 3
            </p>
            <h2 className="text-base font-bold text-white">
              {step === 1 && '名前を設定'}
              {step === 2 && '人数規模を選択'}
              {step === 3 && '構成タイプを選択'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-5 pt-3">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-sm transition-all duration-300 ${
                s <= step ? 'bg-[#FF4D00]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-5 min-h-[260px]">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-xs text-white/40">フォーメーション名</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canNext1 && setStep(2)}
                placeholder="例: Aメロ 隊形1"
                className="w-full bg-white/8 border border-white/10 rounded-md px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-[#FF4D00]/50 focus:bg-white/10 transition-all"
              />
              <p className="text-xs text-white/25">後から変更できます</p>
            </div>
          )}

          {/* Step 2: Scale */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 mb-3">チームの人数規模を選んでください</p>
              <div className="grid grid-cols-2 gap-3">
                {SCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setScale(opt.value)}
                    className={`relative flex flex-col gap-2 p-4 rounded-md border text-left transition-all ${
                      scale === opt.value
                        ? 'bg-[#FF4D00]/10 border-[#FF4D00]/50'
                        : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/20'
                    }`}
                  >
                    {scale === opt.value && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-sm bg-[#FF4D00] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-sm bg-white" />
                      </div>
                    )}
                    <span className={scale === opt.value ? 'text-[#FF4D00]' : 'text-white/40'}>
                      {opt.icon}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${scale === opt.value ? 'text-white' : 'text-white/70'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5">{opt.sub}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-sm w-fit ${
                      scale === opt.value ? 'bg-[#FF4D00]/20 text-[#FF4D00]' : 'bg-white/8 text-white/30'
                    }`}>
                      {opt.range}
                    </span>
                  </button>
                ))}
              </div>
              {/* Visual hint */}
              <div className="mt-2 p-3 rounded-md bg-white/5 border border-white/5 text-xs text-white/35 flex items-start gap-2">
                <Music2 size={13} className="mt-0.5 shrink-0 text-[#FF4D00]/60" />
                {scale === 'large'
                  ? '大人数モードではダンサーを小さく表示し、グループカラーで色分け管理できます。'
                  : '少人数モードでは各ダンサーを名前付きで大きく表示し、個別操作が快適です。'}
              </div>
            </div>
          )}

          {/* Step 3: Stage type */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 mb-3">演舞の構成タイプを選んでください</p>
              <div className="grid grid-cols-2 gap-3">
                {STAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStage(opt.value)}
                    className={`relative flex flex-col gap-2 p-4 rounded-md border text-left transition-all ${
                      stage === opt.value
                        ? 'bg-[#FF4D00]/10 border-[#FF4D00]/50'
                        : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/20'
                    }`}
                  >
                    {stage === opt.value && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-sm bg-[#FF4D00] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-sm bg-white" />
                      </div>
                    )}
                    <span className={stage === opt.value ? 'text-[#FF4D00]' : 'text-white/40'}>
                      {opt.icon}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${stage === opt.value ? 'text-white' : 'text-white/70'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5">{opt.sub}</p>
                    </div>
                    <StagePreview type={opt.value} active={stage === opt.value} />
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-2 p-3 rounded-md bg-[#FF4D00]/8 border border-[#FF4D00]/15 text-xs space-y-1">
                <p className="text-[#FF4D00] font-semibold">設定サマリー</p>
                <p className="text-white/50">
                  「{name}」·&nbsp;
                  {preview.range} ({preview.label}) ·&nbsp;
                  {stagePreview.label}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          {step > 1 && (
            <button
              onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 rounded-md bg-white/8 text-white/60 text-sm hover:bg-white/12 transition-all"
            >
              戻る
            </button>
          )}
          <button
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-md bg-white/5 text-white/40 text-sm hover:bg-white/10 transition-all ${step > 1 ? '' : 'flex-1'}`}
          >
            キャンセル
          </button>
          <button
            disabled={step === 1 && !canNext1}
            onClick={() => {
              if (step < 3) { setStep(s => (s + 1) as 2 | 3); }
              else { onConfirm(name.trim(), scale, stage); }
            }}
            className="flex-1 py-2.5 rounded-md bg-[#FF4D00] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#E04500] transition-all"
          >
            {step < 3 ? '次へ' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StagePreview({ type, active }: { type: StageMode; active: boolean }) {
  const color = active ? '#FF4D00' : 'rgba(255,255,255,0.15)';
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" className="mt-1">
      {type === 'stage' ? (
        <>
          <rect x="2" y="6" width="44" height="20" rx="3" fill="none" stroke={color} strokeWidth="1.5"/>
          <rect x="2" y="22" width="44" height="8" rx="2" fill={color} opacity="0.3"/>
          <text x="24" y="18" textAnchor="middle" fontSize="6" fill={color} fontFamily="sans-serif">STAGE</text>
        </>
      ) : (
        <>
          <rect x="14" y="2" width="20" height="28" rx="3" fill="none" stroke={color} strokeWidth="1.5"/>
          <line x1="14" y1="20" x2="34" y2="20" stroke={color} strokeWidth="1" opacity="0.4"/>
          <line x1="14" y1="12" x2="34" y2="12" stroke={color} strokeWidth="1" opacity="0.4"/>
          <text x="24" y="8" textAnchor="middle" fontSize="5" fill={color} fontFamily="sans-serif">↑進行</text>
        </>
      )}
    </svg>
  );
}
