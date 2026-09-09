import React from "react";
import { PrintIQGauge } from "./SharedReportComponents";
import { calculateAdvancedMetrics } from "@/lib/cpm-analysis";

/**
 * Membersihkan teks dari simbol markdown yang dihasilkan AI
 * (Adopsi dari generate_laporan_premium.py → clean_ai_text())
 */
function cleanAiText(text: string): string {
  if (!text) return "";
  // Hapus simbol delimiter ===HEADER===
  let cleaned = text.replace(/===\w[\w\s]*===/g, "");
  // Hapus markdown bold/italic
  cleaned = cleaned.replace(/\*\*/g, "").replace(/\*/g, "");
  // Hapus markdown heading
  cleaned = cleaned.replace(/^#{1,3}\s+/gm, "");
  // Hapus prefix "Status:"
  cleaned = cleaned.replace(/^Status:\s*/gm, "");
  return cleaned.trim();
}

export default function ChildPrintView({ 
  report, testResults, client, ageYears, ageMonths, dateStr, aiNarrative, notesData, clientReports = []
}: { 
  report: any, testResults: any[], client: any, ageYears: number, ageMonths: number, dateStr: string, aiNarrative: any, notesData: any, clientReports?: any[] 
}) {
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const percentile = cogScore.percentile || 0;
  
  const levelGrade = cogScore.level?.grade || cogScore.calculatedData?.level?.grade || "-";
  
  // Breakdown skor K1 / K2 / Total (Adopsi dari CPM-App)
  const attempt1 = cogScore.calculatedData?.attempt1_correct ?? 0;
  const attempt2 = cogScore.calculatedData?.attempt2_correct ?? 0;
  const totalScore = cogScore.calculatedData?.totalRawScore ?? cogScore.rawScore ?? cogScore.totalRawScore ?? 0;

  // Raw data per item untuk tabel profil respons (Set A/AB/B)
  const rawItems: any[] = cogResult?.raw_data || [];
  
  // Mapping nomor soal ke Set (1-12 = A, 13-24 = AB, 25-36 = B) — konvensi CPM-App lama
  const getSetItems = (items: any[], setLetter: string) => {
    return items.filter(item => {
      const qId = String(item.questionId || '');
      const num = parseInt(qId);
      if (!isNaN(num)) {
        if (setLetter === 'A') return num >= 1 && num <= 12;
        if (setLetter === 'AB') return num >= 13 && num <= 24;
        if (setLetter === 'B') return num >= 25 && num <= 36;
      }
      // Fallback: format A1-A12, AB1-AB12, B1-B12
      if (setLetter === 'A') return qId.startsWith('A') && !qId.startsWith('AB');
      if (setLetter === 'AB') return qId.startsWith('AB');
      if (setLetter === 'B') return qId.startsWith('B');
      return false;
    });
  };

  const formatTime = (ms: number | null | undefined) => {
    if (ms == null || ms === 0) return '-';
    return (ms / 1000).toFixed(1) + 's';
  };

  // Discrepancy analysis (adopsi dari CPM-App)
  const expectedScoresTable: Record<number, [number,number,number]> = {
    10:[5,3,2],11:[6,3,2],12:[7,3,2],13:[7,3,3],14:[7,4,3],15:[7,4,4],16:[8,4,4],
    17:[8,5,4],18:[8,5,4],19:[8,5,5],20:[8,7,5],21:[9,7,5],22:[9,8,5],23:[9,8,6],
    24:[10,8,6],25:[10,9,6],26:[10,9,7],27:[10,10,7],28:[10,10,8],29:[11,10,8],
    30:[11,10,9],31:[11,10,10],32:[11,11,10],33:[11,11,11],34:[12,11,11],35:[12,12,11],
  };
  const expectedScores = totalScore >= 10 && totalScore <= 35 ? expectedScoresTable[totalScore] : null;
  const setAItems = getSetItems(rawItems, 'A');
  const setABItems = getSetItems(rawItems, 'AB');
  const setBItems = getSetItems(rawItems, 'B');
  const scoreA = setAItems.filter(i => i.isFirstAttemptCorrect).length;
  const scoreAB = setABItems.filter(i => i.isFirstAttemptCorrect).length;
  const scoreB = setBItems.filter(i => i.isFirstAttemptCorrect).length;
  const discA = expectedScores ? scoreA - expectedScores[0] : null;
  const discAB = expectedScores ? scoreAB - expectedScores[1] : null;
  const discB = expectedScores ? scoreB - expectedScores[2] : null;
  const isValid = discA !== null && discAB !== null && discB !== null 
    ? Math.abs(discA) <= 2 && Math.abs(discAB) <= 2 && Math.abs(discB) <= 2
    : true;

  let psychogramPremium = cogScore.calculatedData?.psychogramPremium;
  
  if (!psychogramPremium && cogResult?.raw_data) {
    // Fallback: Calculate on the fly for old data
    const ageDecimal = ageYears + (ageMonths / 12);
    try {
      const recalc = calculateAdvancedMetrics(cogResult.raw_data, ageDecimal, client?.name || "Klien");
      psychogramPremium = recalc.psychogramPremium;
    } catch (e) {
      console.error("Failed to recalculate psychogram", e);
    }
  }

  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogScore.final_html;

  // Nama Ibu dari field mother_name atau fallback ke parent fields
  const namaIbu = client?.mother_name || "-";
  const namaAyah = client?.parent_name || "-";

  // Waktu pemeriksaan dari test result jika tersedia
  const testStartTime = cogResult?.created_at || report?.created_at;
  const testDateStr = testStartTime 
    ? new Date(testStartTime).toLocaleDateString("id-ID", { dateStyle: "long" }) 
    : "-";
  const testTimeStr = testStartTime
    ? new Date(testStartTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    : "-";

  const printBar = (score: number, colorClass: string) => {
    return (
      <div className="w-full bg-slate-200 h-3 rounded-sm overflow-hidden flex items-center" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}>
        <div className={`h-full ${colorClass}`} style={{ width: `${score}%`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}></div>
      </div>
    );
  };

  const DOMAIN_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
    'COGNITIVE':                { bg: 'bg-[#2c3e50]', text: 'text-[#2c3e50]', hex: '#2c3e50' },
    'ATTENTION & CONCENTRATION': { bg: 'bg-[#2980b9]', text: 'text-[#2980b9]', hex: '#2980b9' },
    'EXECUTIVE FUNCTIONS':       { bg: 'bg-[#27ae60]', text: 'text-[#27ae60]', hex: '#27ae60' },
    'TASK COMMITMENT':           { bg: 'bg-[#f39c12]', text: 'text-[#f39c12]', hex: '#f39c12' },
    'EMOTIONAL REGULATION':      { bg: 'bg-[#c0392b]', text: 'text-[#c0392b]', hex: '#c0392b' },
    'LEARNING CHARACTERISTICS':  { bg: 'bg-[#8e44ad]', text: 'text-[#8e44ad]', hex: '#8e44ad' },
  };

  const renderDomain = (domainName: string, aspects: any) => {
    if (!aspects) return null;
    const colors = DOMAIN_COLORS[domainName] || { bg: 'bg-slate-600', text: 'text-slate-600', hex: '#475569' };
    return (
      <React.Fragment key={domainName}>
        <tr>
          <td colSpan={2} className={`py-1.5 px-3 font-bold text-xs uppercase bg-slate-50 border-y border-slate-200 ${colors.text}`}>
            {domainName}
          </td>
        </tr>
        {Object.entries(aspects).map(([aspectName, score]: [string, any]) => (
          <tr key={aspectName}>
            <td className="py-1.5 px-6 text-[11px] font-medium text-slate-700 w-1/2 align-middle border-b border-slate-100">
              - {aspectName}
            </td>
            <td className="py-1.5 px-4 w-1/2 align-middle border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <div 
                    className="w-full bg-slate-200 h-3 rounded-sm overflow-hidden"
                    style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}
                  >
                    <div 
                      className="h-full rounded-sm" 
                      style={{ 
                        width: `${Math.round(score)}%`, 
                        backgroundColor: colors.hex,
                        WebkitPrintColorAdjust: "exact", 
                        printColorAdjust: "exact"
                      } as any}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 w-8 text-right font-medium">({Math.round(score)}%)</span>
              </div>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  };

  // Parse sections dari AI narrative (adopsi dari CPM-App)
  const parseAiSections = () => {
    const raw = aiNarrative?.interpretation || cogScore.calculatedData?.interpretationText || "";
    const conclusion = cleanAiText(aiNarrative?.conclusion || cogScore.calculatedData?.interpretationConclusion || "Menunggu kesimpulan klinis.");
    const recommendation = cleanAiText(aiNarrative?.recommendation || cogScore.calculatedData?.recommendationText || "Saran akan ditambahkan oleh psikolog.");

    // Split dinamika ke dalam paragraf-paragraf terpisah (jika ada \n\n)
    const dinamikaRaw = cleanAiText(raw);
    const paragraphs = dinamikaRaw.includes("\n\n")
      ? dinamikaRaw.split("\n\n").map(p => p.trim()).filter(p => p.length > 0)
      : dinamikaRaw ? [dinamikaRaw] : [];

    return { paragraphs, conclusion, recommendation };
  };

  const aiSections = !finalHtml ? parseAiSections() : null;

  return (
    <div className="font-serif text-slate-900 pb-10">
      {/* PAGE 1: IDENTITAS */}
      <div className="keep-together mb-12">
        <h2 className="text-2xl font-black text-center text-slate-800 mb-8 uppercase tracking-widest border-b-2 border-slate-200 pb-4">
          Laporan Hasil Pemeriksaan Psikologis
        </h2>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mx-auto max-w-3xl shadow-sm">
          <table className="w-full text-[13px] leading-[2.2]">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-48 font-semibold text-slate-600">No. Pendaftaran</td>
                <td className="font-medium">: {client?.registration_number || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Nama Lengkap</td>
                <td className="font-bold uppercase text-slate-900">: {client?.name || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Nama Panggilan</td>
                <td className="capitalize font-medium">: {client?.nickname || client?.name?.split(' ')[0] || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Tempat, Tanggal Lahir</td>
                <td className="font-medium">
                  : {client?.birth_place || "-"}, {client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Usia saat Tes</td>
                <td className="font-medium">: {ageYears} tahun {ageMonths} bulan</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Asal Sekolah</td>
                <td className="uppercase font-medium">: {client?.school_or_institution || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Pilihan Kelas</td>
                <td className="uppercase font-medium">: {client?.grade || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Nama Ayah</td>
                <td className="capitalize font-medium">: {namaAyah}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Nama Ibu</td>
                <td className="capitalize font-medium">: {namaIbu}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Alamat</td>
                <td className="capitalize font-medium">: {client?.address || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="font-semibold text-slate-600">Tanggal Pemeriksaan</td>
                <td className="font-medium">: {testDateStr}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-600">Waktu Pemeriksaan</td>
                <td className="font-medium">: {testTimeStr}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 2: PROFIL PSIKOLOGIS */}
      <div className="keep-together mb-8">
        <div className="border-l-4 border-slate-800 bg-slate-100 text-slate-900 font-bold px-4 py-2 mb-6 uppercase tracking-widest text-sm">
          PROFIL PSIKOLOGIS
        </div>
        
        <div className="mb-8 border border-slate-200 rounded-xl p-5 bg-white">
          <h3 className="font-bold text-slate-800 text-[14px] mb-4 uppercase tracking-wide border-b border-slate-100 pb-2">A. Kapasitas Kognitif Umum</h3>
          
          {/* Score Cards 3-kolom (adopsi dari CPM-App Old report.html) */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-4 bg-white border-2 border-slate-200 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Skor Total</p>
              <p className="text-4xl font-black text-slate-900 leading-none">{totalScore}</p>
              <p className="text-[10px] text-slate-400 mt-1">dari 36</p>
            </div>
            <div className="text-center p-4 bg-white border-2 border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Persentil</p>
              <p className="text-4xl font-black text-slate-900 leading-none">{percentile || '-'}</p>
              <p className="text-[10px] text-slate-400 mt-1">IQ: {iqValue || '-'}</p>
            </div>
            <div className="text-center p-4 bg-slate-800 rounded-xl" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold mb-1">Grade</p>
              <p className="text-4xl font-black text-white leading-none">{levelGrade}</p>
              <p className="text-[10px] text-slate-400 mt-1">{cogScore.classification || cogScore.level?.level || '-'}</p>
            </div>
          </div>

          {/* Skor breakdown K1/K2 */}
          <div className="flex justify-between w-full text-[13px] leading-relaxed mb-4">
            <table className="w-[48%]">
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="w-36 text-slate-600 py-1 font-semibold">Skor Total (K1+K2)</td>
                  <td className="font-black text-slate-900">: {totalScore} / 36</td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="text-slate-600 py-1">↳ Kesempatan 1</td>
                  <td className="font-bold text-slate-900">: {attempt1} / 36</td>
                </tr>
                <tr>
                  <td className="text-slate-600 py-1">↳ Kesempatan 2</td>
                  <td className="font-bold text-slate-900">: {attempt2} / 36</td>
                </tr>
              </tbody>
            </table>
            <table className="w-[48%]">
              <tbody>
                {expectedScores && (
                  <>
                    <tr className="border-b border-slate-50">
                      <td className="w-28 text-slate-600 py-1 text-[12px]">Skor Set A (1-12)</td>
                      <td className="font-bold text-slate-900 text-[12px]">: {scoreA} <span className={`text-[11px] ${discA! > 2 || discA! < -2 ? 'text-red-600' : 'text-slate-400'}`}>({discA! >= 0 ? '+' : ''}{discA})</span></td>
                    </tr>
                    <tr className="border-b border-slate-50">
                      <td className="text-slate-600 py-1 text-[12px]">Skor Set AB (13-24)</td>
                      <td className="font-bold text-slate-900 text-[12px]">: {scoreAB} <span className={`text-[11px] ${discAB! > 2 || discAB! < -2 ? 'text-red-600' : 'text-slate-400'}`}>({discAB! >= 0 ? '+' : ''}{discAB})</span></td>
                    </tr>
                    <tr>
                      <td className="text-slate-600 py-1 text-[12px]">Skor Set B (25-36)</td>
                      <td className="font-bold text-slate-900 text-[12px]">: {scoreB} <span className={`text-[11px] ${discB! > 2 || discB! < -2 ? 'text-red-600' : 'text-slate-400'}`}>({discB! >= 0 ? '+' : ''}{discB})</span></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {!isValid && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-[11px] text-yellow-800">
              <strong>⚠️ Peringatan Validitas:</strong> Selisih (Discrepancy) skor Set ({discA}, {discAB}, {discB}) ada yang melebihi ±2 dari nilai ekspektasi. Hasil tes mungkin tidak sepenuhnya menggambarkan kapasitas kognitif yang sebenarnya.
            </div>
          )}

          {/* Visual Bar Perbandingan K1 vs K2 */}
          {(attempt1 > 0 || attempt2 > 0) && (() => {
            const k1Pct = Math.round((attempt1 / 36) * 100);
            const k2Pct = Math.round((attempt2 / 36) * 100);
            const gap = attempt2 - attempt1;
            
            let gapLabel = "";
            let gapColor = "";
            let gapNote = "";
            if (attempt2 >= 6 && attempt1 <= 18) {
              gapLabel = "📈 Learning Potential";
              gapColor = "#2980b9";
              gapNote = "Kapasitas belajar baik saat diberi kesempatan kedua. Mungkin butuh waktu pemanasan (warming up) atau konfirmasi sebelum yakin menjawab.";
            } else if (attempt2 >= 4 && attempt1 > 18) {
              gapLabel = "⚡ Learning Agility";
              gapColor = "#27ae60";
              gapNote = "Mampu memperbaiki jawaban di kesempatan kedua dengan dasar kognitif yang sudah kuat — menunjukkan fleksibilitas berpikir.";
            } else if (attempt2 <= 1 && attempt1 < 24) {
              gapLabel = "⚠️ Perlu Perhatian";
              gapColor = "#c0392b";
              gapNote = "Kurang memanfaatkan kesempatan kedua. Mungkin menunjukkan kecenderungan menyerah lebih awal atau tingkat persistensi yang perlu dikembangkan.";
            } else if (attempt2 === 0) {
              gapLabel = "—  Tidak Memanfaatkan K2";
              gapColor = "#7f8c8d";
              gapNote = "Anak tidak menggunakan kesempatan kedua sama sekali. Bisa jadi karena sudah yakin, atau tidak memperhatikan opsi revisi.";
            } else {
              gapLabel = "✅ Konsisten";
              gapColor = "#f39c12";
              gapNote = "Profil skor K1 dan K2 menunjukkan pola yang wajar.";
            }

            return (
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Analisis Skor K1 vs K2</p>
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-600 w-28">Kesempatan 1</span>
                    <div className="flex-1 bg-slate-200 h-4 rounded-sm overflow-hidden" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}>
                      <div className="h-full rounded-sm bg-[#2c3e50]" style={{ width: `${k1Pct}%`, backgroundColor: "#2c3e50", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 w-14 text-right">{attempt1}/36 ({k1Pct}%)</span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-600 w-28">Kesempatan 2</span>
                    <div className="flex-1 bg-slate-200 h-4 rounded-sm overflow-hidden" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}>
                      <div className="h-full rounded-sm" style={{ width: `${k2Pct}%`, backgroundColor: "#2980b9", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 w-14 text-right">{attempt2}/36 ({k2Pct}%)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-black tracking-wide" style={{ color: gapColor }}>{gapLabel}</span>
                  <span className="text-[10px] text-slate-600 leading-[1.5] flex-1 font-sans">{gapNote}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {psychogramPremium && (

          <div className="keep-together mb-8">
            <h3 className="font-bold text-slate-800 text-[14px] mb-3 uppercase tracking-wide">B. Dinamika Aspek Psikologis</h3>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800 text-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}>
                    <th className="py-2.5 px-4 text-xs font-bold tracking-wider">DOMAIN / ASPEK</th>
                    <th className="py-2.5 px-4 text-xs font-bold tracking-wider">LEVEL (PERSENTIL)</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {Object.keys(DOMAIN_COLORS).map(domain => renderDomain(domain, psychogramPremium[domain]))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-sans">
              * KETERANGAN: Persentil berdasarkan observasi dan norma informal | Bar Warna = Level kemampuan/karakteristik per domain
            </p>
          </div>
        )}
      </div>


      <div className="break-before-page pt-4"></div>

      {/* PAGE 3: DINAMIKA KEPRIBADIAN & BELAJAR */}
      <div className="keep-together mb-8">
        <div className="border-l-4 border-slate-800 bg-slate-100 text-slate-900 font-bold px-4 py-2 mb-6 uppercase tracking-widest text-sm">
          Dinamika Kepribadian &amp; Belajar
        </div>
        
        <div className="text-[13px] leading-[1.8] text-slate-800 text-justify font-serif px-2">
          {finalHtml ? (
             <div className="prose prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4" dangerouslySetInnerHTML={{ __html: finalHtml }} />
          ) : (
            <>
              {aiSections && aiSections.paragraphs.length > 0 ? (
                <div className="space-y-4">
                  {aiSections.paragraphs.map((para, idx) => (
                    <p key={idx} className="text-[13px] leading-[1.8] text-slate-800 text-justify font-serif mb-2">
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{cogScore.calculatedData?.interpretationText || "Analisis sedang diproses."}</div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="break-before-page pt-4"></div>

      {/* PAGE 4: KESIMPULAN & REKOMENDASI */}
      <div className="keep-together mb-12">
        <div className="border-l-4 border-slate-800 bg-slate-100 text-slate-900 font-bold px-4 py-2 mb-6 uppercase tracking-widest text-sm mt-6">
          Kesimpulan
        </div>
        <div className="text-[13px] leading-[1.8] text-slate-800 text-justify font-serif mb-8 px-2 font-semibold">
          {aiSections?.conclusion || aiNarrative?.conclusion || "Menunggu kesimpulan klinis."}
        </div>

        <div className="border-l-4 border-slate-800 bg-slate-100 text-slate-900 font-bold px-4 py-2 mb-6 uppercase tracking-widest text-sm">
          Rekomendasi
        </div>
        <div className="text-[13px] leading-[1.8] text-slate-800 text-justify font-serif px-2">
          {aiSections ? (
            /* Render rekomendasi line per line dengan bold untuk heading Di Rumah/Di Sekolah */
            <div className="space-y-1">
              {aiSections.recommendation.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                const isHeading = /^(Di Rumah|Di Sekolah|Tips untuk Orang Tua)/i.test(trimmed);
                return (
                  <p key={idx} className={isHeading ? "font-bold mt-3 mb-1" : "ml-2"}>
                    {trimmed}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {aiNarrative?.recommendation || cogScore.calculatedData?.recommendationText || "Saran akan ditambahkan oleh psikolog."}
            </div>
          )}
        </div>
        
        {/* CATATAN KHUSUS */}
        {notesData?.notes && (
          <div className={`mt-10 border p-6 rounded-xl border-amber-200 bg-amber-50`}>
            <h4 className={`font-bold text-[13px] mb-3 uppercase tracking-widest border-b pb-2 text-amber-700 border-amber-200`}>
              Catatan Khusus
            </h4>
            <div className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap font-serif">
              {notesData.notes}
            </div>
          </div>
        )}
      </div>

      {/* HALAMAN LAMPIRAN: PROFIL RESPONS PER ITEM */}
      {rawItems.length > 0 && (
        <>
          <div className="break-before-page pt-4"></div>
          <div className="mb-8">
            <div className="border-l-4 border-slate-800 bg-slate-100 text-slate-900 font-bold px-4 py-2 mb-6 uppercase tracking-widest text-sm">
              Lampiran: Profil Respons Per Item (Internal Psikolog)
            </div>

            {!isValid && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-[11px] text-red-800">
                <strong>⚠️ PERINGATAN VALIDITAS TES:</strong> Discrepancy skor ({discA !== null ? discA : 'N/A'}, {discAB !== null ? discAB : 'N/A'}, {discB !== null ? discB : 'N/A'}) ada yang melebihi batas ±2. Pertimbangkan validitas hasil sebelum interpretasi final.
              </div>
            )}

            {/* Tabel 3 kolom: Set A | Set AB | Set B */}
            <div className="grid grid-cols-3 gap-4 text-[11px]">
              {([['A', setAItems, scoreA, discA, expectedScores?.[0]], ['AB', setABItems, scoreAB, discAB, expectedScores?.[1]], ['B', setBItems, scoreB, discB, expectedScores?.[2]]] as [string, any[], number, number|null, number|undefined][]).map(([setName, items, total, disc, exp]) => (
                <div key={setName} className="rounded-lg overflow-hidden border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                        <th colSpan={6} className="px-2 py-2 text-left text-xs font-bold">SET {setName}</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-600 text-[10px]">
                        <th className="px-1 py-1 text-left">No</th>
                        <th className="px-1 py-1 text-center">W1</th>
                        <th className="px-1 py-1 text-center">J1</th>
                        <th className="px-1 py-1 text-center">W2</th>
                        <th className="px-1 py-1 text-center">J2</th>
                        <th className="px-1 py-1 text-center">✓</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length: 12}).map((_, idx) => {
                        const item = items[idx];
                        const correct = item?.isFirstAttemptCorrect;
                        return (
                          <tr key={idx} className={`border-b border-slate-100 ${correct === false ? 'bg-red-50' : ''}`}>
                            <td className="px-1 py-0.5 text-slate-600 font-medium">{item?.questionId || `${setName}${idx+1}`}</td>
                            <td className="px-1 py-0.5 text-center text-slate-500">{formatTime(item?.firstAttemptTimeMs)}</td>
                            <td className="px-1 py-0.5 text-center font-medium">{item ? (item.firstAttemptAnswer + 1) : '-'}</td>
                            <td className="px-1 py-0.5 text-center text-slate-500">{formatTime(item?.secondAttemptTimeMs)}</td>
                            <td className="px-1 py-0.5 text-center">{item?.secondAttemptAnswer != null ? (item.secondAttemptAnswer + 1) : '-'}</td>
                            <td className="px-1 py-0.5 text-center font-bold" style={{ color: correct ? '#27ae60' : '#c0392b' } as any}>
                              {item ? (correct ? '✓' : '✗') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={5} className="px-1 py-1.5 text-slate-700 text-[10px]">Total (Expected: {exp ?? 'N/A'})</td>
                        <td className="px-1 py-1.5 text-center text-slate-900">{total}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-1 py-1 text-slate-500 text-[10px]">Discrepancy</td>
                        <td className={`px-1 py-1 text-center font-bold text-[10px] ${disc !== null && Math.abs(disc) > 2 ? 'text-red-600' : 'text-slate-600'}`}>
                          {disc !== null ? (disc >= 0 ? `+${disc}` : disc) : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-slate-400 mt-3 font-sans">
              * W1=Waktu Kesempatan 1 (detik) | J1=Jawaban K1 | W2=Waktu Kesempatan 2 | J2=Jawaban K2 | ✓=Benar berdasarkan K1 | Discrepancy = Skor - Expected ±2 (Valid jika |Disc| ≤ 2)
            </p>

            {/* Observasi Kualitatif — dari notesData di FULL mode */}
            {notesData?.obs && Object.keys(notesData.obs).length > 0 && (
              <div className="mt-6">
                <div className="border-l-4 border-teal-600 bg-teal-50 text-teal-900 font-bold px-4 py-2 mb-4 text-sm" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                  Ringkasan Observasi Kualitatif
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  {Object.entries(notesData.obs).map(([group, data]: [string, any]) => {
                    const checked = Object.entries(data || {}).filter(([k, v]) => k !== 'notes' && v === true).map(([k]) => k);
                    const notes = data?.notes;
                    if (checked.length === 0 && !notes) return null;
                    return (
                      <div key={group} className="border border-slate-200 rounded-lg p-2 bg-white">
                        <p className="font-bold text-slate-700 capitalize mb-1">{group.replace(/([A-Z])/g, ' $1').trim()}</p>
                        {checked.length > 0 && <p className="text-slate-600">{checked.join(', ')}</p>}
                        {notes && <p className="text-slate-500 italic mt-1">&ldquo;{notes}&rdquo;</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-16 text-[9px] text-slate-500 text-justify leading-relaxed">
        <strong>DISCLAIMER:</strong><br/>
        Laporan ini merupakan gambaran kondisi psikologis anak pada saat pemeriksaan dilakukan. Kondisi psikologis anak dapat berubah seiring dengan perkembangan usia, stimulasi lingkungan, dan kondisi fisik/kesehatan. Hasil pemeriksaan ini bersifat rahasia dan hanya diperuntukkan bagi orang tua dan pihak sekolah (jika diizinkan) untuk kepentingan pendidikan anak.
      </div>
    </div>
  );
}
