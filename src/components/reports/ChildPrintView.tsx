import React from "react";
import { PrintIQGauge, PrintBar } from "./SharedReportComponents";

export default function ChildPrintView({ 
  report, testResults, client, ageYears, ageMonths, dateStr, viewMode, aiNarrative, notesData, clientReports = []
}: { 
  report: any, testResults: any[], client: any, ageYears: number, ageMonths: number, dateStr: string, viewMode: "CLEAN" | "FULL", aiNarrative: any, notesData: any, clientReports?: any[] 
}) {
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const percentile = cogScore.percentile || 0;

  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogResult?.calculated_score?.final_html;

  return (
    <>
      <div className="mb-8 keep-together border border-slate-200 p-4 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase border-b border-slate-200 pb-2">Identitas Peserta</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 w-48 text-slate-600 font-medium">Nama Lengkap</td>
              <td className="py-1 font-semibold">: {client?.name || "-"}</td>
              <td className="py-1 w-48 text-slate-600 font-medium">No. Pendaftaran</td>
              <td className="py-1">: {client?.registration_number || "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Tanggal Lahir</td>
              <td className="py-1">: {client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td>
              <td className="py-1 text-slate-600 font-medium">Jenis Kelamin</td>
              <td className="py-1">: {client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600 font-medium">Asal Sekolah/Instansi</td>
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

      {viewMode === "FULL" && cogScore.psychogram?.processProfile && (
        <div className="mb-8 keep-together">
          <h3 className="font-bold bg-slate-700 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">B. Indeks Perilaku dan Proses Pengerjaan</h3>
          <div className="p-4 border-x border-b border-slate-200 rounded-b-lg">
            {Object.values(cogScore.psychogram.processProfile).map((item: any, idx) => (
              <PrintBar key={idx} label={item.construct} value={item.score} max={100} color="#6366f1" />
            ))}
            <p className="text-[10px] text-slate-500 mt-4 font-medium italic">
              *Indeks di atas merupakan ekstraksi otomatis dari pola waktu respons (response latency) dan persistensi selama tes, disajikan sebagai data objektif internal (1-100) pendamping hasil observasi klinis psikolog.
            </p>
          </div>
        </div>
      )}

      {(finalHtml || aiNarrative) && (
        <div className="mb-8">
          <div className="page-break" />
          <h3 className="font-bold bg-orange-600 text-white p-2 mb-4 text-sm uppercase rounded-t-lg">
            C. Dinamika Psikologis & Kesimpulan
          </h3>
          <div className="p-8 border-x border-b border-slate-200 rounded-b-lg">
            {finalHtml ? (
              <div 
                className="prose prose-sm max-w-none text-slate-800 font-serif leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: finalHtml }} 
              />
            ) : (
              <>
                {aiNarrative.interpretation && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">Dinamika Kepribadian & Potensi</h4>
                    <div className="text-sm leading-relaxed text-slate-700 text-justify whitespace-pre-wrap font-serif">
                      {aiNarrative.interpretation}
                    </div>
                  </div>
                )}
                {aiNarrative.conclusion && (
                  <div className="mb-6 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">Kesimpulan Utama</h4>
                    <div className="text-sm leading-relaxed text-slate-700 text-justify whitespace-pre-wrap font-serif">
                      {aiNarrative.conclusion}
                    </div>
                  </div>
                )}
                {aiNarrative.recommendation && (
                  <div className="mb-4 keep-together">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">Rekomendasi Langkah</h4>
                    <div className="text-sm leading-relaxed text-slate-700 text-justify whitespace-pre-wrap font-serif">
                      {aiNarrative.recommendation}
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
