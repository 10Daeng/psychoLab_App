import React from "react";
import { PrintIQGauge, PrintBar } from "./SharedReportComponents";

export default function StudentPrintView({ 
  report, testResults, client, ageYears, ageMonths, dateStr, viewMode, aiNarrative, notesData, clientReports = []
}: { 
  report: any, testResults: any[], client: any, ageYears: number, ageMonths: number, dateStr: string, viewMode: "CLEAN" | "FULL", aiNarrative: any, notesData: any, clientReports?: any[]
}) {
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const vakResult = testResults.find((r: any) => r.tests?.code === "VAK");
  const riasecResult = testResults.find((r: any) => ["SDS", "RIASEC"].includes(r.tests?.code));

  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const percentile = cogScore.percentile || 0;
  
  const vakScore = vakResult?.calculated_score?.calculatedData || {};
  const riasecScore = riasecResult?.calculated_score?.calculatedData || {};

  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogResult?.calculated_score?.final_html 
                 || riasecResult?.calculated_score?.final_html;

  return (
    <>
      <div className="mb-8 keep-together border border-slate-200 p-4 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase border-b border-slate-200 pb-2">Identitas Peserta</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 w-48 text-slate-600 font-medium">Nama Lengkap</td>
              <td className="py-1 font-semibold">: {client?.name || "-"}</td>
              <td className="py-1 w-48 text-slate-600 font-medium">No. Induk / NISN</td>
              <td className="py-1">: {client?.registration_number || "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Tanggal Lahir</td>
              <td className="py-1">: {client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td>
              <td className="py-1 text-slate-600 font-medium">Jenis Kelamin</td>
              <td className="py-1">: {client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Asal Sekolah</td>
              <td className="py-1">: {client?.school_or_institution || "-"}</td>
              <td className="py-1 text-slate-600 font-medium">Kelas</td>
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

      {(riasecResult || vakResult) && (
        <div className="mb-8">
          <div className="page-break" />
          <h3 className="font-bold bg-teal-700 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">
            B. Profil Minat, Bakat & Gaya Belajar
          </h3>
          <div className="grid grid-cols-2 gap-6 p-4 border-x border-b border-slate-200 rounded-b-lg">
            
            {riasecResult && (
              <div className="col-span-1 keep-together border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase">Minat Karir (RIASEC)</h4>
                <p className="text-xs text-slate-500 mb-4">Kode Puncak: <strong className="text-slate-800">{riasecScore.top_code || "-"}</strong></p>
                {['R', 'I', 'A', 'S', 'E', 'C'].map(code => (
                   riasecScore[code] !== undefined ? 
                    <PrintBar key={code} label={{R:"Realistic", I:"Investigative", A:"Artistic", S:"Social", E:"Enterprising", C:"Conventional"}[code]!} value={riasecScore[code]} max={50} color="#6366f1" /> 
                    : null
                ))}
              </div>
            )}

            <div className="col-span-1 flex flex-col gap-6">
              {vakResult && (
                <div className="keep-together border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase">Gaya Belajar (VAK)</h4>
                  <PrintBar label="Visual" value={vakScore.V || 0} max={30} color="#3b82f6" />
                  <PrintBar label="Auditory" value={vakScore.A || 0} max={30} color="#a855f7" />
                  <PrintBar label="Kinesthetic" value={vakScore.K || 0} max={30} color="#22c55e" />
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {(finalHtml || aiNarrative?.stuData) && (
        <div className="mb-8">
          <div className="page-break" />
          <h3 className="font-bold bg-orange-600 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">
            C. Analisis Lanjutan & Rekomendasi Karir
          </h3>
          <div className="p-8 border-x border-b border-slate-200 rounded-b-lg">
            
            {finalHtml ? (
              <div 
                className="prose prose-sm max-w-none text-slate-800 font-serif leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: finalHtml }} 
              />
            ) : (
              <>
                {aiNarrative.stuData.interpretasiTerpadu && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">1. Interpretasi Terpadu</h4>
                    <ul className="list-disc pl-5 space-y-1 mb-3">
                      {aiNarrative.stuData.interpretasiTerpadu.poinAnalisis?.map((poin: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 leading-relaxed font-serif">{poin}</li>
                      ))}
                    </ul>
                    <div className="bg-orange-50 p-3 rounded-lg border-l-2 border-orange-400 text-sm text-slate-800 italic font-serif">
                      "{aiNarrative.stuData.interpretasiTerpadu.paragrafKesimpulan}"
                    </div>
                  </div>
                )}

                {aiNarrative.stuData.saranPengembangan && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">2. Saran Pengembangan Praktis</h4>
                    
                    {aiNarrative.stuData.saranPengembangan.lingkunganRumah && (
                      <div className="mb-3">
                        <h5 className="font-bold text-slate-700 text-xs uppercase mb-1">A. Lingkungan Rumah & Keluarga</h5>
                        <table className="w-full text-sm border-collapse mt-2">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700">
                              <th className="border border-slate-300 p-2 text-left w-1/4">Potensi</th>
                              <th className="border border-slate-300 p-2 text-left w-1/2">Saran Kegiatan</th>
                              <th className="border border-slate-300 p-2 text-left w-1/4">Manfaat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiNarrative.stuData.saranPengembangan.lingkunganRumah.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="border border-slate-300 p-2 font-semibold text-slate-800">{item.potensi}</td>
                                <td className="border border-slate-300 p-2 text-slate-700">{item.kegiatan}</td>
                                <td className="border border-slate-300 p-2 text-slate-600 text-xs">{item.manfaat}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {aiNarrative.stuData.saranPengembangan.kolaborasiSekolah && (
                        <div>
                          <h5 className="font-bold text-slate-700 text-xs uppercase mb-1">B. Kolaborasi Sekolah</h5>
                          <ul className="list-disc pl-4 space-y-1">
                            {aiNarrative.stuData.saranPengembangan.kolaborasiSekolah.map((saran: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-700 font-serif leading-relaxed">{saran}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiNarrative.stuData.saranPengembangan.pengembanganKarakter && (
                        <div>
                          <h5 className="font-bold text-slate-700 text-xs uppercase mb-1">C. Pengembangan Karakter</h5>
                          <ul className="list-disc pl-4 space-y-1">
                            {aiNarrative.stuData.saranPengembangan.pengembanganKarakter.map((saran: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-700 font-serif leading-relaxed">{saran}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {aiNarrative.stuData.petaMasaDepan && (
                  <div className="mb-4 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">3. Peta Masa Depan (Rekomendasi Karir)</h4>
                    
                    {aiNarrative.stuData.petaMasaDepan.rekomendasiKarir && (
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        {aiNarrative.stuData.petaMasaDepan.rekomendasiKarir.map((item: any, idx: number) => (
                          <div key={idx} className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-bold text-slate-900 text-sm">{idx + 1}. {item.bidang}</p>
                            </div>
                            <p className="text-sm text-slate-700 mb-1"><strong className="text-slate-800">Contoh Profesi:</strong> {item.contohKarir}</p>
                            <p className="text-xs text-slate-600 italic font-serif">{item.alasanKesesuaian}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {aiNarrative.stuData.petaMasaDepan.pesanUntukOrangTua && (
                      <div className="mt-6 border border-slate-400 bg-slate-100 rounded-xl p-4 text-center">
                        <p className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">Pesan Untuk Orang Tua</p>
                        <p className="text-sm text-slate-800 font-serif leading-relaxed">
                          "{aiNarrative.stuData.petaMasaDepan.pesanUntukOrangTua}"
                        </p>
                      </div>
                    )}
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
