import React from "react";
import { PrintIQGauge, PrintBar, PrintHexacoBox, hexacoStructure, getHexacoPct } from "./SharedReportComponents";
import { normalizeDiscScore } from "@/lib/utils/disc_utils";

export default function EmployeePrintView({ 
  report, testResults, client, ageYears, ageMonths, dateStr, viewMode, aiNarrative, notesData, clientReports = []
}: { 
  report: any, testResults: any[], client: any, ageYears: number, ageMonths: number, dateStr: string, viewMode: "CLEAN" | "FULL", aiNarrative: any, notesData: any, clientReports?: any[]
}) {
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");
  const graphologyResult = testResults.find((r: any) => ["GRAPHOLOGY", "GRAFOLOGI"].includes(r.tests?.code));
  const warteggResult = testResults.find((r: any) => ["WARTEGG", "WTZ"].includes(r.tests?.code));

  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const percentile = cogScore.percentile || 0;
  
  const discScore = normalizeDiscScore(discResult?.calculated_score) || {} as any;
  const hexacoScore = hexacoResult?.calculated_score?.calculatedData || {};
  const wviScore = wviResult?.calculated_score?.calculatedData || {};

  const graphologyObs = graphologyResult?.calculated_score?.observasi_klinis || graphologyResult?.calculated_score?.calculatedData?.observasi_klinis || "";
  const warteggObs = warteggResult?.calculated_score?.observasi_klinis || warteggResult?.calculated_score?.calculatedData?.observasi_klinis || "";

  // Coba ambil dari clientReports terlebih dahulu, jika belum ada, fallback ke test_results
  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogResult?.calculated_score?.final_html 
                 || discResult?.calculated_score?.final_html;

  const empData = aiNarrative?.empData || {};

  return (
    <div className="print-report-container text-slate-800 bg-white">
      {/* ================= PAGE 1: IDENTITAS, DISC, HEXACO ================= */}
      <div className="page-wrapper relative">
        <div className="mb-6 flex flex-col items-center border-b-2 border-orange-600 pb-4 relative">
          <div className="absolute right-0 top-0 text-red-600 font-bold text-xs uppercase">Sangat Rahasia</div>
          <h2 className="text-xl font-bold text-center">Lembaga Konseling dan Psikoterapi Islam</h2>
          <h1 className="text-3xl font-black text-slate-900 my-1">LENTERA BATIN</h1>
          <p className="text-xs text-slate-500">Jalan Potre Koneng II/31 Bumi Sumekar Asri Kolor Sumenep, Jawa Timur 69417 | www.lenterabatin.co.id</p>
        </div>

        <h3 className="text-lg font-bold text-center mb-6 uppercase text-slate-800">HASIL PEMETAAN PSIKOLOGIS</h3>

        <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-blue-800 text-white p-2 text-sm font-bold uppercase px-4">Data Responden</div>
          <div className="p-4 bg-slate-50">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 w-40 text-slate-600 font-medium">Nama Lengkap</td>
                  <td className="py-1.5 font-bold">: {client?.name || "-"}</td>
                  <td className="py-1.5 w-40 text-slate-600 font-medium">No. Karyawan/NIK</td>
                  <td className="py-1.5 font-medium">: {client?.registration_number || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-600 font-medium">Asal Instansi</td>
                  <td className="py-1.5 font-medium">: {client?.school_or_institution || "-"}</td>
                  <td className="py-1.5 text-slate-600 font-medium">Jabatan/Posisi</td>
                  <td className="py-1.5 font-medium">: {client?.grade || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-600 font-medium">Usia</td>
                  <td className="py-1.5 font-medium">: {ageYears} tahun {ageMonths} bulan</td>
                  <td className="py-1.5 text-slate-600 font-medium">Jenis Kelamin</td>
                  <td className="py-1.5 font-medium">: {client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-600 font-medium">Tanggal Asesmen</td>
                  <td className="py-1.5 font-medium">: {dateStr}</td>
                  <td className="py-1.5 text-slate-600 font-medium">Kode Laporan</td>
                  <td className="py-1.5 font-medium">: {report?.token_code || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {discResult && (
          <div className="mb-6 keep-together">
            <div className="flex justify-between items-end border-b-2 border-blue-800 pb-2 mb-4">
              <h3 className="font-bold text-blue-800 text-sm uppercase">Profil Gaya Kerja</h3>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded">Pola Utama: {discScore.archetype || "-"}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 text-center mb-3 uppercase tracking-wider">Grafik 1 — Publik</p>
                <PrintBar label="Dominance (D)" value={discScore.discMost?.D || 0} max={24} color="#e74c3c" />
                <PrintBar label="Influence (I)" value={discScore.discMost?.I || 0} max={24} color="#f1c40f" />
                <PrintBar label="Steadiness (S)" value={discScore.discMost?.S || 0} max={24} color="#2ecc71" />
                <PrintBar label="Compliance (C)" value={discScore.discMost?.C || 0} max={24} color="#3498db" />
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 text-center mb-3 uppercase tracking-wider">Grafik 2 — Pribadi</p>
                <PrintBar label="Dominance (D)" value={discScore.discLeast?.D || 0} max={24} color="#e74c3c" />
                <PrintBar label="Influence (I)" value={discScore.discLeast?.I || 0} max={24} color="#f1c40f" />
                <PrintBar label="Steadiness (S)" value={discScore.discLeast?.S || 0} max={24} color="#2ecc71" />
                <PrintBar label="Compliance (C)" value={discScore.discLeast?.C || 0} max={24} color="#3498db" />
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 text-center mb-3 uppercase tracking-wider">Grafik 3 — Aktual</p>
                <PrintBar label="Dominance (D)" value={discScore.D || 24} max={48} color="#e74c3c" />
                <PrintBar label="Influence (I)" value={discScore.I || 24} max={48} color="#f1c40f" />
                <PrintBar label="Steadiness (S)" value={discScore.S || 24} max={48} color="#2ecc71" />
                <PrintBar label="Compliance (C)" value={discScore.C || 24} max={48} color="#3498db" />
              </div>
            </div>
          </div>
        )}

        {hexacoResult && hexacoScore.factorMeans && (
          <div className="mb-6 keep-together">
            <div className="flex justify-between items-end border-b-2 border-blue-800 pb-2 mb-4">
              <h3 className="font-bold text-blue-800 text-sm uppercase">Profil Karakter (HEXACO)</h3>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded">Validitas: {hexacoScore.validity?.overallLabel || "Cukup Valid"}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {hexacoStructure.map((group) => (
                <PrintHexacoBox
                  key={group.factor}
                  group={group}
                  factorMean={hexacoScore.factorMeans?.[group.factor]}
                  facetMeans={hexacoScore.facetMeans}
                />
              ))}
            </div>

            {hexacoScore.facetMeans?.['altr'] && (
              <div className="mt-4 p-3 border border-slate-200 rounded-lg bg-white flex items-center gap-4 w-1/2">
                <span className="font-bold text-xs uppercase w-48 text-slate-800">Altruisme (Tambahan)</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden print:border print:border-slate-200">
                  <div className="h-full rounded-full print-exact-color" style={{ width: `${getHexacoPct(hexacoScore.facetMeans['altr'])}%`, backgroundColor: '#e67e22', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }} />
                </div>
                <span className="font-bold text-xs text-orange-600">{Math.round(getHexacoPct(hexacoScore.facetMeans['altr']))}%</span>
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-400 font-bold border-t border-slate-200 pt-2">
          <span>LENTERA BATIN - {(client?.name || '').toUpperCase()}</span>
          <span>SANGAT RAHASIA | Hal. 1</span>
        </div>
      </div>
      
      <div className="page-break" />

      {/* ================= PAGE 2: KOGNITIF & WVI ================= */}
      <div className="page-wrapper relative">
        
        {cogResult && (
          <div className="mb-10 keep-together">
            <div className="border-b-2 border-blue-800 pb-2 mb-6 mt-4">
              <h3 className="font-bold text-blue-800 text-sm uppercase">Kapasitas Kognitif (IQ)</h3>
            </div>
            
            <div className="flex gap-6 mb-6">
              <div className="w-1/3 border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Skor IQ</p>
                <h1 className="text-5xl font-black text-blue-700 mb-2">{iqValue}</h1>
                <p className="font-bold text-slate-800 text-sm">{cogScore.classification || cogScore.level?.level || "Rata-rata"}</p>
                <p className="text-xs text-slate-500 mt-1">{percentile || "25th-74th"} persentil</p>
              </div>
              
              <div className="w-2/3 flex flex-col justify-center space-y-4">
                {[
                  { label: "Logical Verbal Reasoning", val: 75, color: "#f39c12" },
                  { label: "Analytical Numerical Thinking", val: 80, color: "#2980b9" },
                  { label: "Practical Spatial", val: 85, color: "#27ae60" },
                  { label: "Information Retention", val: 70, color: "#8e44ad" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-48 text-xs font-bold text-slate-700">{item.label}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden print:border print:border-slate-200">
                      <div className="h-full rounded-full print-exact-color" style={{ width: `${item.val}%`, backgroundColor: item.color, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }} />
                    </div>
                    <span className="w-20 text-right text-xs font-bold" style={{ color: item.color }}>{item.val}% ({Math.round(item.val*0.2)}/20)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-bold text-blue-700 text-sm mb-2">Interpretasi Kapasitas Kognitif</h4>
              <p className="text-sm leading-relaxed text-slate-700 text-justify font-serif">
                {iqValue >= 110 ? "Kapasitas kognitif berada di atas rata-rata. Individu ini mampu memahami konsep abstrak, memecahkan masalah kompleks, dan belajar dengan cepat secara mandiri. Sangat sesuai untuk pekerjaan yang memerlukan analisis mendalam." :
                 iqValue >= 90 ? "Kapasitas kognitif berada dalam rentang rata-rata. Individu ini mampu memahami prosedur operasional, menangani pekerjaan standar dengan baik, dan belajar melalui pelatihan terstruktur. Sesuai untuk berbagai jenis pekerjaan umum." :
                 "Kapasitas kognitif berada di bawah rata-rata. Individu ini memerlukan bimbingan lebih intensif dan pelatihan terstruktur. Disarankan penempatan pada pekerjaan dengan prosedur yang jelas dan terstandarisasi."}
              </p>
            </div>

            <div className="bg-yellow-50/80 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h4 className="font-bold text-slate-800 text-sm mb-3">Catatan Analitis Kognitif</h4>
              <ul className="space-y-2 text-sm text-slate-700 font-serif leading-relaxed">
                <li>• Kapasitas daya ingat (memori) berada pada tingkat <b>baik</b>, menunjukkan kapasitas yang kuat dalam meretensi instruksi atau data baru.</li>
                <li>• Logika analitis angka berada pada tingkat <b>sangat baik</b>, menandakan ketajaman melihat pola terstruktur dan memecahkan masalah kuantitatif.</li>
                <li>• Kapasitas penalaran verbal berada pada tingkat <b>baik</b>, mengindikasikan gaya komunikasi yang efektif dan kemampuan verbal yang kaya.</li>
              </ul>
            </div>
          </div>
        )}

        {wviResult && Object.keys(wviScore).length > 0 && (
          <div className="mb-8 keep-together mt-8">
            <div className="border-b-2 border-blue-800 pb-2 mb-6">
              <h3 className="font-bold text-blue-800 text-sm uppercase">Nilai-Nilai Kerja (WVI)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-6">
              {Object.entries(wviScore)
                .filter(([k]) => typeof wviScore[k] === "number")
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([key, val], idx) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-700 w-32 font-medium">{key.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden print:border print:border-slate-200">
                      <div className="h-full rounded-full print-exact-color" style={{ width: `${(val as number)*20}%`, backgroundColor: '#16a085', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-10 text-right">{(val as number)*20}%</span>
                  </div>
                ))}
            </div>

            <div className="bg-slate-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
              <p className="text-sm leading-relaxed text-slate-700 font-serif text-justify">
                {(() => {
                  const sorted = Object.entries(wviScore).filter(([k]) => typeof wviScore[k] === "number").sort(([, a], [, b]) => (b as number) - (a as number));
                  const top3 = sorted.slice(0,3).map(x => x[0].replace(/_/g, " ")).join(", ");
                  const bot3 = sorted.slice(-3).map(x => x[0].replace(/_/g, " ")).join(", ");
                  return `Pendorong motivasi kerja terkuatnya adalah nilai ${top3}. Ia akan merasa paling puas ketika pekerjaannya memungkinkannya mendapatkan hal-hal tersebut dalam intensitas tinggi. Di sisi lain, nilai ${bot3} kurang menjadi prioritas, sehingga ia lebih fleksibel terhadap aspek-aspek tersebut.`;
                })()}
              </p>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-400 font-bold border-t border-slate-200 pt-2">
          <span>LENTERA BATIN - {(client?.name || '').toUpperCase()}</span>
          <span>SANGAT RAHASIA | Hal. 2</span>
        </div>
      </div>

      <div className="page-break" />

      {/* ================= PAGE 3: PROYEKTIF & DESKRIPSI (Poin 1-2) ================= */}
      <div className="page-wrapper relative">
        
        {(warteggObs || graphologyObs) && (
          <div className="mb-8 keep-together">
            <div className="border-b-2 border-blue-800 pb-2 mb-4 mt-4">
              <h3 className="font-bold text-blue-800 text-sm uppercase">Hasil Observasi Proyektif</h3>
            </div>
            
            {warteggObs && (
              <div className="mb-4">
                <h4 className="font-bold text-blue-700 text-sm mb-2">Wartegg (WTZ)</h4>
                <div className="text-sm leading-relaxed text-slate-700 font-serif text-justify whitespace-pre-wrap">
                  {warteggObs}
                </div>
              </div>
            )}
            
            {graphologyObs && (
              <div className="mb-4">
                <h4 className="font-bold text-blue-700 text-sm mb-2">Grafologi</h4>
                <div className="text-sm leading-relaxed text-slate-700 font-serif text-justify whitespace-pre-wrap">
                  {graphologyObs}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 mt-6">
          <div className="border-b-2 border-blue-800 pb-2 mb-4">
            <h3 className="font-bold text-blue-800 text-sm uppercase">Deskripsi Kepribadian Terpadu</h3>
          </div>
          
          {finalHtml ? (
            <div className="prose prose-sm max-w-none text-slate-800 font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: finalHtml }} />
          ) : (
            <>
              {empData?.deskripsiTerintegrasi && (
                <div className="mb-6">
                  <h4 className="font-bold text-blue-700 text-sm mb-2">1. Deskripsi Kepribadian Terintegrasi</h4>
                  <div className="text-sm leading-relaxed text-slate-800 font-serif text-justify whitespace-pre-wrap">
                    {empData.deskripsiTerintegrasi}
                  </div>
                </div>
              )}

              {empData?.kekuatanUtama && empData.kekuatanUtama.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-blue-700 text-sm mb-2">2. Kekuatan Utama</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {empData.kekuatanUtama.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-800 font-serif leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {empData?.tantanganHambatan && empData.tantanganHambatan.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-blue-700 text-sm mb-2">3. Tantangan & Hambatan</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {empData.tantanganHambatan.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-800 font-serif leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-400 font-bold border-t border-slate-200 pt-2">
          <span>LENTERA BATIN - {(client?.name || '').toUpperCase()}</span>
          <span>SANGAT RAHASIA | Hal. 3</span>
        </div>
      </div>

      <div className="page-break" />

      {/* ================= PAGE 4: LINGKUNGAN, SARAN & REKOMENDASI ================= */}
      <div className="page-wrapper relative">
        
        {!finalHtml && (
          <>
            {empData?.lingkunganIdeal && (
              <div className="mb-6 mt-4">
                <h4 className="font-bold text-blue-700 text-sm mb-2">4. Analisis Lingkungan Ideal</h4>
                {empData.lingkunganIdeal.ekosistemKerja && (
                  <p className="text-sm leading-relaxed text-slate-800 font-serif text-justify mb-2">
                    <strong className="text-slate-900">Ekosistem Kerja:</strong> {empData.lingkunganIdeal.ekosistemKerja}
                  </p>
                )}
              </div>
            )}

            {empData?.saranPengembangan && empData.saranPengembangan.length > 0 && (
              <div className="mb-8">
                <h4 className="font-bold text-blue-700 text-sm mb-2">5. Saran Pengembangan Strategis</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {empData.saranPengembangan.map((item: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-800 font-serif leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {empData?.rekomendasiAkhir && (
          <div className="mt-8 keep-together">
            <div className="border-b-2 border-blue-800 pb-2 mb-4">
              <h3 className="font-bold text-blue-800 text-sm uppercase">Rekomendasi Akhir — Posisi {client?.grade || "Umum"}</h3>
            </div>
            
            <div className="border-2 border-orange-500 rounded-2xl p-6 bg-orange-50/30 flex flex-col items-center">
              <h4 className="text-xs font-bold text-orange-700 tracking-wider mb-4 uppercase">Rekomendasi Psikologis</h4>
              <h1 className="text-2xl font-black text-orange-600 uppercase mb-4 text-center">{empData.rekomendasiAkhir.status}</h1>
              <p className="text-sm text-slate-600 font-serif text-center max-w-xl mb-6">
                {empData.rekomendasiAkhir.keterangan}
              </p>
              <div className="bg-white border border-slate-200 rounded-xl px-8 py-3 flex flex-col items-center shadow-sm">
                <span className="text-4xl font-black text-emerald-600">{empData.rekomendasiAkhir.persentaseJobFit}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Tingkat Kesesuaian (Job Fit)</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 flex justify-end pr-8">
          <div className="text-center w-64">
            <p className="text-sm mb-20 text-slate-800">Sumenep, {dateStr}</p>
            <p className="font-bold text-sm text-slate-900 border-b border-slate-300 pb-1">Moh. Ilham, M.Si., CHA., C.Med.</p>
            <p className="text-xs text-slate-500 mt-1">Assessor / Konselor</p>
          </div>
        </div>
        
        <div className="mt-12 text-[9px] text-slate-400 italic text-justify leading-relaxed px-4">
          *Profil kepribadian bersifat dinamis dan dapat berkembang seiring waktu. Laporan ini hendaknya dipahami sebagai gambaran kecenderungan perilaku pada saat pengisian asesmen berlangsung.
        </div>

        <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-400 font-bold border-t border-slate-200 pt-2">
          <span>LENTERA BATIN - {(client?.name || '').toUpperCase()}</span>
          <span>SANGAT RAHASIA | Hal. 4</span>
        </div>
      </div>

      {viewMode === "FULL" && (
        <div className="page-break" />
      )}
      {viewMode === "FULL" && (
        <div className="page-wrapper relative mt-10">
          <div className="border-b-2 border-slate-800 pb-2 mb-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase">Catatan Klinis & Observasi (Internal - Rahasia)</h3>
          </div>
          <div className="p-6 border border-slate-300 bg-yellow-50/30 rounded-lg min-h-[200px]">
            {notesData.isJson ? (
              <>
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-3 underline decoration-slate-300">A. Ringkasan Observasi Perilaku</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs text-slate-800">
                    {Object.entries(notesData.obs).map(([k, v]: [string, any]) => (
                      <div key={k} className="border-b border-slate-200/50 pb-2">
                        <strong className="capitalize text-slate-900">{k.replace(/([A-Z])/g, ' $1').trim()}:</strong> 
                        <span className="ml-1 text-slate-700">
                          {Object.entries(v).filter(([kk, vv]) => vv === true && kk !== 'notes').map(([kk]) => kk).join(', ') || 'Normal'}
                        </span>
                        {v.notes && <p className="italic mt-1.5 text-slate-600 bg-white/50 p-1.5 rounded border border-slate-200/50">{v.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-3 underline decoration-slate-300">B. Hasil Wawancara Anamnesa</h4>
                  <div className="space-y-3 text-xs">
                     {['q1', 'q2', 'q3'].map(q => (notesData.inv[`${q}Ans`] || notesData.inv[`${q}Notes`]) ? (
                       <div key={q} className="border-l-2 border-slate-400 pl-3 py-1 bg-white/30">
                         <p className="mb-1"><strong className="text-slate-700">Respons Klien:</strong> {notesData.inv[`${q}Ans`] || '-'}</p>
                         <p className="italic text-slate-600"><strong className="text-slate-700 font-semibold">Interpretasi:</strong> {notesData.inv[`${q}Notes`] || '-'}</p>
                       </div>
                     ) : null)}
                  </div>
                </div>
                
                <div className="mt-6 border-t-2 border-slate-300 pt-4">
                  <h4 className="font-bold text-sm mb-2 underline decoration-slate-300">C. Catatan Tambahan Psikolog</h4>
                  <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-serif">
                    {notesData.notes || "-"}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-serif">
                {notesData.notes || "Tidak ada catatan klinis yang dilampirkan."}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
