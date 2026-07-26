import React from "react";

export function IQGauge({ iq }: { iq: number }) {
  const pct = Math.min(100, Math.max(0, ((iq - 50) / 100) * 100));
  const color = iq >= 120 ? "#22c55e" : iq >= 100 ? "#3b82f6" : iq >= 85 ? "#f59e0b" : "#ef4444";
  const label = iq >= 130 ? "Sangat Superior" : iq >= 120 ? "Superior" : iq >= 110 ? "Rata-rata Atas" : iq >= 90 ? "Rata-rata" : iq >= 80 ? "Rata-rata Bawah" : "Kurang";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${2.513 * pct} ${251.3}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800">{iq}</span>
          <span className="text-[10px] text-slate-500 font-bold">IQ</span>
        </div>
      </div>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

export function TraitBar({ label, value, max = 5, color = "#3b82f6" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-36 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold text-slate-700 w-10 text-right">{value.toFixed ? value.toFixed(1) : value}</span>
    </div>
  );
}

export function PrintIQGauge({ iq }: { iq: number }) {
  const pct = Math.min(100, Math.max(0, ((iq - 50) / 100) * 100));
  const color = iq >= 120 ? "#22c55e" : iq >= 100 ? "#3b82f6" : iq >= 85 ? "#f59e0b" : "#ef4444";
  const label = iq >= 130 ? "Sangat Superior" : iq >= 120 ? "Superior" : iq >= 110 ? "Rata-rata Atas" : iq >= 90 ? "Rata-rata" : iq >= 80 ? "Rata-rata Bawah" : "Kurang";
  return (
    <div className="flex flex-col items-center gap-2 keep-together">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${2.513 * pct} ${251.3}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800">{iq}</span>
          <span className="text-[10px] text-slate-500 font-bold">IQ</span>
        </div>
      </div>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

export function PrintBar({ label, value, max = 5, color = "#3b82f6" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3 py-1 keep-together">
      <span className="text-xs text-slate-700 w-32 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden print:border print:border-slate-300">
        <div className="h-full rounded-full print-exact-color" style={{ width: `${pct}%`, backgroundColor: color, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }} />
      </div>
      <span className="text-xs font-bold text-slate-800 w-10 text-right">{typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}</span>
    </div>
  );
}
