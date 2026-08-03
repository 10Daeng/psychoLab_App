import React from "react";
import { PrintIQGauge, PrintBar } from "./SharedReportComponents";

export default function EmployeePrintView({ 
  report, testResults, client, ageYears, ageMonths, dateStr, viewMode, aiNarrative, notesData, clientReports = []
}: { 
  report: any, testResults: any[], client: any, ageYears: number, ageMonths: number, dateStr: string, viewMode: "CLEAN" | "FULL", aiNarrative: any, notesData: any, clientReports?: any[]
}) {
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");

  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const percentile = cogScore.percentile || 0;
  
  const discScore = discResult?.calculated_score?.calculatedData || {};
  const hexacoScore = hexacoResult?.calculated_score?.calculatedData || {};
  const wviScore = wviResult?.calculated_score?.calculatedData || {};

  // Coba ambil dari clientReports terlebih dahulu, jika belum ada, fallback ke test_results (untuk backward compatibility sementara)
  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogResult?.calculated_score?.final_html 
                 || discResult?.calculated_score?.final_html;

  return (
    <>
      <div className="mb-8 keep-together border border-slate-200 p-4 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase border-b border-slate-200 pb-2">Identitas Peserta</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 w-48 text-slate-600 font-medium">Nama Lengkap</td>
              <td className="py-1 font-semibold">: {client?.name || "-"}</td>
              <td className="py-1 w-48 text-slate-600 font-medium">No. Karyawan / NIK</td>
              <td className="py-1">: {client?.registration_number || "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Tanggal Lahir</td>
              <td className="py-1">: {client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td>
              <td className="py-1 text-slate-600 font-medium">Jenis Kelamin</td>
              <td className="py-1">: {client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Asal Instansi</td>
              <td className="py-1">: {client?.school_or_institution || "-"}</td>
              <td className="py-1 text-slate-600 font-medium">Jabatan / Posisi</td>
              <td className="py-1">: {client?.grade || "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Usia saat Tes</td>
              <td className="py-1">: {ageYears} tahun {ageMonths} bulan</td>
              <td className="py-1 text-slate-600 font-medium">Tanggal Pemeriksaan</td>
              <td className="py-1">: {report?.created_at ? new Date(report.created_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {cogResult && (
        <div className="mb-8 keep-together">
          <h3 className="font-bold bg-blue-700 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">A. Profil Kognitif ({cogResult.tests?.code})</h3>
          <div className="grid grid-cols-3 gap-6 p-4 border-x border-b border-slate-200 rounded-b-lg">
            <div className="col-span-1 flex justify-center border-r border-slate-200">
              {iqValue > 0 ? <PrintIQGauge iq={iqValue} /> : <div className="text-slate-400 p-8">IQ Tidak Tersedia</div>}
            </div>
            <div className="col-span-2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 text-slate-600 border-b border-slate-100">Skor Mentah (Raw Score)</td>
                    <td className="py-2 font-bold text-right border-b border-slate-100">{cogScore.rawScore ?? cogScore.totalRawScore ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 border-b border-slate-100">Persentil</td>
                    <td className="py-2 font-bold text-right border-b border-slate-100">{percentile || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 border-b border-slate-100">Klasifikasi Kognitif</td>
                    <td className="py-2 font-bold text-right text-blue-700 border-b border-slate-100">{cogScore.classification || cogScore.level?.level || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(discResult || hexacoResult || wviResult) && (
        <div className="mb-8">
          <div className="page-break" />
          <h3 className="font-bold bg-teal-700 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">
            B. Profil Kepribadian & Gaya Kerja
          </h3>
          <div className="grid grid-cols-2 gap-6 p-4 border-x border-b border-slate-200 rounded-b-lg">
            
            {discResult && (
              <div className="col-span-1 keep-together border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase">Dinamika Perilaku (DISC)</h4>
                <p className="text-xs text-slate-500 mb-4">Arketipe Dominan: <strong className="text-slate-800">{discScore.archetype || "-"}</strong></p>
                <PrintBar label="Dominance (D)" value={discScore.D || 24} max={48} color="#ef4444" />
                <PrintBar label="Influence (I)" value={discScore.I || 24} max={48} color="#f59e0b" />
                <PrintBar label="Steadiness (S)" value={discScore.S || 24} max={48} color="#22c55e" />
                <PrintBar label="Compliance (C)" value={discScore.C || 24} max={48} color="#3b82f6" />
              </div>
            )}

            {hexacoResult && hexacoScore.H !== undefined && (
              <div className="col-span-1 keep-together border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase">Integritas & Kepribadian (HEXACO)</h4>
                <PrintBar label="Kejujuran/Rendah Hati (H)" value={hexacoScore.H} max={5} color="#10b981" />
                <PrintBar label="Emosionalitas (E)" value={hexacoScore.E} max={5} color="#f59e0b" />
                <PrintBar label="Ekstraversi (X)" value={hexacoScore.X} max={5} color="#3b82f6" />
                <PrintBar label="Kooperatif (A)" value={hexacoScore.A} max={5} color="#8b5cf6" />
                <PrintBar label="Tanggung Jawab (C)" value={hexacoScore.C} max={5} color="#06b6d4" />
                <PrintBar label="Keterbukaan (O)" value={hexacoScore.O} max={5} color="#f43f5e" />
              </div>
            )}

            <div className="col-span-1 flex flex-col gap-6">
              {wviResult && Object.keys(wviScore).length > 0 && (
                <div className="keep-together border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase">Nilai Kerja (WVI) Top 5</h4>
                  {Object.entries(wviScore)
                    .filter(([k]) => typeof wviScore[k] === "number")
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([key, val]) => (
                      <PrintBar key={key} label={key.replace(/_/g, " ")} value={val as number} max={5} color="#f59e0b" />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {(finalHtml || aiNarrative?.empData) && (
        <div className="mb-8">
          <div className="page-break" />
          <h3 className="font-bold bg-orange-600 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">
            C. Deskripsi Kepribadian Terpadu
          </h3>
          <div className="p-8 border-x border-b border-slate-200 rounded-b-lg">
            {finalHtml ? (
              <div 
                className="prose prose-sm max-w-none text-slate-800 font-serif leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: finalHtml }} 
              />
            ) : (
              // Fallback jika belum disimpan dari TipTap
              <>
                {aiNarrative.empData?.deskripsiTerintegrasi && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">1. Deskripsi Kepribadian Terintegrasi</h4>
                    <div className="text-sm leading-relaxed text-slate-700 text-justify whitespace-pre-wrap font-serif">
                      {aiNarrative.empData.deskripsiTerintegrasi}
                    </div>
                  </div>
                )}

                {aiNarrative.empData?.kekuatanUtama && aiNarrative.empData.kekuatanUtama.length > 0 && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">2. Kekuatan Utama</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {aiNarrative.empData.kekuatanUtama.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 leading-relaxed font-serif">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiNarrative.empData?.lingkunganIdeal && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">3. Lingkungan Berkembang Optimal</h4>
                    {aiNarrative.empData.lingkunganIdeal.ekosistemKerja && (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-serif text-justify mb-2">
                        {aiNarrative.empData.lingkunganIdeal.ekosistemKerja}
                      </p>
                    )}
                  </div>
                )}

                {aiNarrative.empData?.saranPengembangan && aiNarrative.empData.saranPengembangan.length > 0 && (
                  <div className="mb-8 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">4. Saran Pengembangan</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {aiNarrative.empData.saranPengembangan.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 leading-relaxed font-serif">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiNarrative.empData?.rekomendasiAkhir && (
                  <div className="keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-400 pb-1 uppercase">
                      Rekomendasi Akhir — {client?.grade || "Posisi Umum"}
                    </h4>
                    <div className="border-2 border-orange-500 rounded-lg p-5 flex items-center justify-between mt-3 bg-orange-50/30">
                      <div className="flex-1 text-center border-r-2 border-orange-200 pr-5">
                        <p className="text-xl font-black text-orange-600 uppercase mb-3">
                          {aiNarrative.empData.rekomendasiAkhir.status}
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed font-serif">
                          {aiNarrative.empData.rekomendasiAkhir.keterangan}
                        </p>
                      </div>
                      <div className="w-32 flex flex-col items-center justify-center pl-5">
                        <span className="text-4xl font-black text-emerald-600">{aiNarrative.empData.rekomendasiAkhir.persentaseJobFit}%</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Job Fit</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {viewMode === "FULL" && (
        <div className="mb-8 keep-together">
          <div className="page-break" />
          <h3 className="font-bold bg-slate-800 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">Catatan Klinis & Observasi (Rahasia)</h3>
          <div className="p-6 border border-slate-300 bg-yellow-50/30 rounded-b-lg min-h-[200px]">
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
    </>
  );
}
