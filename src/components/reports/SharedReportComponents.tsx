import React from "react";
import { motion } from "framer-motion";

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

// === ADVANCED REPORT COMPONENTS (DARK MODE) === //

export const hexacoStructure = [
  { factor: 'H', name: 'Kejujuran & Kerendahan Hati', color: '#8e44ad', facets: [{k:'sinc',n:'Ketulusan'},{k:'fair',n:'Keadilan'},{k:'gree',n:'Tanpa Keserakahan'},{k:'mode',n:'Kesederhanaan'}] },
  { factor: 'E', name: 'Emosionalitas', color: '#c0392b', facets: [{k:'fear',n:'Ketakutan'},{k:'anxi',n:'Kecemasan'},{k:'depe',n:'Ketergantungan'},{k:'sent',n:'Sentimentalitas'}] },
  { factor: 'X', name: 'Ekstraversi', color: '#2980b9', facets: [{k:'sses',n:'Percaya Diri Sosial'},{k:'socb',n:'Keberanian Sosial'},{k:'soci',n:'Kemudahan Bergaul'},{k:'live',n:'Semangat / Ceria'}] },
  { factor: 'A', name: 'Keramahan', color: '#27ae60', facets: [{k:'forg',n:'Pemaaf'},{k:'gent',n:'Kelembutan'},{k:'flex',n:'Fleksibilitas'},{k:'pati',n:'Kesabaran'}] },
  { factor: 'C', name: 'Kesungguhan (Hati-hati)', color: '#d35400', facets: [{k:'orga',n:'Pengorganisasian'},{k:'dili',n:'Kerajinan'},{k:'perf',n:'Perfeksionisme'},{k:'prud',n:'Kehati-hatian'}] },
  { factor: 'O', name: 'Keterbukaan', color: '#16a085', facets: [{k:'aesa',n:'Apresiasi Estetika'},{k:'inqu',n:'Keingintahuan'},{k:'crea',n:'Kreativitas'},{k:'unco',n:'Originalitas'}] },
];

export const getHexacoPct = (mean: number) => Math.max(0, Math.min(100, (((mean || 1) - 1) / 4) * 100));

export function AdvancedHexacoBox({ group, factorMean, facetMeans }: { group: any, factorMean: number, facetMeans: any }) {
  const factorPct = getHexacoPct(factorMean);
  
  return (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-md hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-[13px] uppercase tracking-wider">{group.name}</h3>
        <span className="text-xs font-bold text-white px-2 py-1 rounded-lg" style={{ backgroundColor: group.color }}>{Math.round(factorPct)}%</span>
      </div>
      
      <div className="space-y-3">
        {group.facets.map((facet: any) => {
          const fm = facetMeans?.[facet.k] || 1;
          const fp = getHexacoPct(fm);
          return (
            <div key={facet.k} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-32 shrink-0">{facet.n}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fp}%`, backgroundColor: group.color, opacity: 0.8 }} />
              </div>
              <span className="text-[10px] font-medium text-slate-500 w-8 text-right">{Math.round(fp)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdvancedDiscBar({ title, scores }: { title: string, scores: any }) {
  const getDiscPct = (raw: number) => Math.max(0, Math.min(100, (((raw || 0) + 24) / 48) * 100));
  const traits = [
    { key: 'D', name: 'Dominance', color: '#e74c3c' },
    { key: 'I', name: 'Influence', color: '#f1c40f' },
    { key: 'S', name: 'Steadiness', color: '#2ecc71' },
    { key: 'C', name: 'Compliance', color: '#3498db' },
  ];

  return (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-md hover:border-slate-700 transition-colors">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 text-center">{title}</h3>
      <div className="space-y-4">
        {traits.map(trait => {
          const raw = scores?.[trait.key] || 0;
          const pct = getDiscPct(raw);
          return (
            <div key={trait.key} className="flex items-center gap-3">
              <span className="text-xs font-bold w-20 text-right" style={{ color: trait.color }}>{trait.name}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                {/* Center Line for Zero point */}
                <div className="absolute left-1/2 top-0 w-px h-full bg-slate-500/50 z-10" />
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: trait.color }} />
              </div>
              <span className="text-xs text-white font-mono w-8 text-right">{raw > 0 ? `+${raw}` : raw}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// Komponen: AdvancedWVIGraph
// -------------------------------------------------------------------------------------------------

export function AdvancedWVIGraph({ scores }: { scores: Record<string, number> }) {
  if (!scores || Object.keys(scores).length === 0) return null;

  // Sorting descending
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const half = Math.ceil(sortedScores.length / 2);
  const col1 = sortedScores.slice(0, half);
  const col2 = sortedScores.slice(half);

  const maxScore = 15; // WVI max rating per trait usually 15

  const renderCol = (items: [string, number][]) => (
    <div className="space-y-3">
      {items.map(([name, score], idx) => {
        const pct = Math.min((score / maxScore) * 100, 100);
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-32 text-xs font-semibold text-slate-300 truncate" title={name}>{name}</div>
            <div className="flex-1 h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className="h-full bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"
              />
            </div>
            <div className="w-8 text-right font-bold text-xs text-teal-400">
              {score}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderCol(col1)}
        {renderCol(col2)}
      </div>
    </div>
  );
}
