import React from "react";
import { PrintIQGauge } from "./SharedReportComponents";

export default function ChildPrintView({ 
  report, testResults, client, ageYears, ageMonths, dateStr, viewMode, aiNarrative, notesData, clientReports = []
}: { 
  report: any, testResults: any[], client: any, ageYears: number, ageMonths: number, dateStr: string, viewMode: "CLEAN" | "FULL", aiNarrative: any, notesData: any, clientReports?: any[] 
}) {
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const percentile = cogScore.percentile || 0;
  
  const levelGrade = cogScore.level?.grade || cogScore.calculatedData?.level?.grade || "-";
  
  const attempt1 = cogScore.calculatedData?.attempt1_correct ?? 0;
  const attempt2 = cogScore.calculatedData?.attempt2_correct ?? 0;
  const totalScore = cogScore.calculatedData?.totalRawScore ?? 0;

  const psychogramPremium = cogScore.calculatedData?.psychogramPremium;

  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogScore.final_html;

  const printBar = (score: number, colorClass: string) => {
    return (
      <div className="w-full bg-slate-200 h-3 rounded-sm overflow-hidden flex items-center">
        <div className={`h-full ${colorClass}`} style={{ width: `${score}%` }}></div>
      </div>
    );
  };

  const renderDomain = (domainName: string, aspects: any, colorClass: string, textClass: string) => {
    if (!aspects) return null;
    return (
      <React.Fragment key={domainName}>
        <tr>
          <td colSpan={2} className={`py-1.5 px-3 font-bold text-xs uppercase bg-slate-50 border-y border-slate-200 ${textClass}`}>
            {domainName}
          </td>
        </tr>
        {Object.entries(aspects).map(([aspectName, score]: [string, any]) => (
          <tr key={aspectName}>
            <td className="py-1.5 px-6 text-[11px] font-medium text-slate-700 w-1/2 align-middle border-b border-slate-100">
              - {aspectName}
            </td>
            <td className="py-1.5 px-4 w-1/2 align-middle border-b border-slate-100 flex items-center gap-2">
              <div className="flex-grow">
                {printBar(score, colorClass)}
              </div>
              <span className="text-[10px] text-slate-500 w-8 text-right font-medium">({Math.round(score)}%)</span>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="font-sans text-slate-800 pb-10">
      {/* PAGE 1: IDENTITAS */}
      <div className="keep-together mb-12">
        <h2 className="text-xl font-bold text-center text-slate-800 mb-10 uppercase tracking-widest">Laporan Hasil Pemeriksaan Psikologis</h2>
        
        <table className="w-full text-[13px] leading-[2.2] mx-auto max-w-3xl">
          <tbody>
            <tr><td className="w-48 font-medium">No. Pendaftaran</td><td>: {client?.registration_number || "-"}</td></tr>
            <tr><td className="font-medium">Nama Lengkap</td><td className="font-bold uppercase">: {client?.name || "-"}</td></tr>
            <tr><td className="font-medium">Nama Panggilan</td><td className="capitalize">: {client?.name?.split(' ')[0] || "-"}</td></tr>
            <tr><td className="font-medium">Tempat, Tanggal Lahir</td><td>: {client?.birth_place || "-"}, {client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td></tr>
            <tr><td className="font-medium">Usia saat Tes</td><td>: {ageYears} tahun {ageMonths} bulan</td></tr>
            <tr><td className="font-medium">Asal Sekolah</td><td className="uppercase">: {client?.school_or_institution || "-"}</td></tr>
            <tr><td className="font-medium">Pilihan Kelas</td><td className="uppercase">: {client?.grade || "-"}</td></tr>
            <tr><td className="font-medium">Nama Ayah</td><td className="capitalize">: {client?.parent_name || "-"}</td></tr>
            <tr><td className="font-medium">Nama Ibu</td><td className="capitalize">: -</td></tr>
            <tr><td className="font-medium">Alamat</td><td className="capitalize">: {client?.address || "-"}</td></tr>
            <tr><td className="font-medium">Tanggal Pemeriksaan</td><td>: {report?.created_at ? new Date(report.created_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="break-before-page pt-4"></div>

      {/* PAGE 2: PROFIL PSIKOLOGIS */}
      <div className="keep-together mb-8">
        <div className="bg-[#3498db] text-white font-bold px-4 py-2 mb-4 text-sm w-full">
          PROFIL PSIKOLOGIS
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 text-[13px] mb-3">A. Kapasitas Kognitif Umum</h3>
          <div className="flex justify-between w-full text-[12px] leading-relaxed">
            <table className="w-[45%]">
              <tbody>
                <tr><td className="w-24">IQ Estimasi</td><td className="font-semibold">: {iqValue}</td></tr>
                <tr><td>Persentil</td><td className="font-semibold">: {percentile}</td></tr>
                <tr><td>Grade</td><td className="font-semibold">: {levelGrade} - {cogScore.classification || cogScore.level?.level || "-"}</td></tr>
              </tbody>
            </table>
            <table className="w-[45%]">
              <tbody>
                <tr><td className="w-28">Skor Total</td><td className="font-semibold">: {totalScore} / 36</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {psychogramPremium && (
          <div>
            <h3 className="font-bold text-slate-800 text-[13px] mb-3">B. Dinamika Aspek Psikologis</h3>
            <table className="w-full border border-slate-200">
              <thead>
                <tr className="bg-slate-100">
                  <th className="py-2 px-3 text-left text-xs font-bold text-slate-800 border-b border-slate-200">DOMAIN / ASPEK</th>
                  <th className="py-2 px-3 text-left text-xs font-bold text-slate-800 border-b border-slate-200">LEVEL (PERSENTIL)</th>
                </tr>
              </thead>
              <tbody>
                {renderDomain('COGNITIVE', psychogramPremium.COGNITIVE, 'bg-[#2c3e50]', 'text-[#2c3e50]')}
                {renderDomain('ATTENTION & CONCENTRATION', psychogramPremium['ATTENTION & CONCENTRATION'], 'bg-[#2980b9]', 'text-[#2980b9]')}
                {renderDomain('EXECUTIVE FUNCTIONS', psychogramPremium['EXECUTIVE FUNCTIONS'], 'bg-[#27ae60]', 'text-[#27ae60]')}
                {renderDomain('TASK COMMITMENT', psychogramPremium['TASK COMMITMENT'], 'bg-[#f39c12]', 'text-[#f39c12]')}
                {renderDomain('EMOTIONAL REGULATION', psychogramPremium['EMOTIONAL REGULATION'], 'bg-[#c0392b]', 'text-[#c0392b]')}
                {renderDomain('LEARNING CHARACTERISTICS', psychogramPremium['LEARNING CHARACTERISTICS'], 'bg-[#8e44ad]', 'text-[#8e44ad]')}
              </tbody>
            </table>
            <p className="text-[9px] text-slate-500 mt-2">
              KETERANGAN: P = Persentil (berdasarkan observasi dan norma informal) | Bar Warna = Level kemampuan/karakteristik
            </p>
          </div>
        )}
      </div>

      <div className="break-before-page pt-4"></div>

      {/* PAGE 3: DINAMIKA KEPRIBADIAN & BELAJAR */}
      <div className="keep-together mb-8">
        <div className="bg-[#3498db] text-white font-bold px-4 py-2 mb-6 uppercase text-sm w-full">
          Dinamika Kepribadian & Belajar
        </div>
        
        <div className="text-[12px] leading-[1.8] text-slate-800 text-justify font-serif">
          {finalHtml ? (
             <div className="prose prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4" dangerouslySetInnerHTML={{ __html: finalHtml }} />
          ) : (
            <>
              {aiNarrative?.interpretation ? (
                <div className="whitespace-pre-wrap">{aiNarrative.interpretation}</div>
              ) : (
                <div className="whitespace-pre-wrap">{cogScore.calculatedData?.interpretationText || "Analisis sedang diproses."}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* PAGE 4: KESIMPULAN & REKOMENDASI (Continuous Flow) */}
      <div className="keep-together mb-12">
        <div className="bg-[#3498db] text-white font-bold px-4 py-2 mb-4 uppercase text-sm w-full mt-6">
          Kesimpulan
        </div>
        <div className="text-[12px] leading-[1.8] text-slate-800 text-justify font-serif mb-6 whitespace-pre-wrap">
          {aiNarrative?.conclusion || "Menunggu kesimpulan klinis."}
        </div>

        <div className="bg-[#3498db] text-white font-bold px-4 py-2 mb-4 uppercase text-sm w-full">
          Rekomendasi
        </div>
        <div className="text-[12px] leading-[1.8] text-slate-800 text-justify font-serif whitespace-pre-wrap">
          {aiNarrative?.recommendation || cogScore.calculatedData?.recommendationText || "Saran akan ditambahkan oleh psikolog."}
        </div>
        
        {viewMode === "FULL" && notesData?.notes && (
          <div className="mt-8 border-t-2 border-slate-300 pt-4">
            <h4 className="font-bold text-[13px] mb-2 text-red-600">Catatan Khusus (Internal)</h4>
            <div className="text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap font-serif">
              {notesData.notes}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-16 text-[9px] text-slate-500 text-justify leading-relaxed">
        <strong>DISCLAIMER:</strong><br/>
        Laporan ini merupakan gambaran kondisi psikologis anak pada saat pemeriksaan dilakukan. Kondisi psikologis anak dapat berubah seiring dengan perkembangan usia, stimulasi lingkungan, dan kondisi fisik/kesehatan. Hasil pemeriksaan ini bersifat rahasia dan hanya diperuntukkan bagi orang tua dan pihak sekolah (jika diizinkan) untuk kepentingan pendidikan anak.
      </div>
    </div>
  );
}
