import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { getDiscPatternName } from '@/lib/scoring';
import { calculateValidityIndex } from '@/lib/validity_engine';

// ==========================================
// COLORS
// ==========================================
const c = {
  primary: '#d35400',
  discD: '#e74c3c', discI: '#f1c40f', discS: '#2ecc71', discC: '#3498db',
  hexH: '#8e44ad', hexE: '#c0392b', hexX: '#2980b9', hexA: '#27ae60', hexC: '#d35400', hexO: '#16a085',
  dark: '#1a1a1a', grey: '#555555', light: '#f7f9fa', line: '#e0e0e0',
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  pageWrap: { paddingTop: 40, paddingBottom: 65, paddingLeft: 55, paddingRight: 55, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },

  rahasia: { color: 'red', fontSize: 10, textAlign: 'right', fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  lembaga: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 5 },
  address: { fontSize: 8, color: c.grey, textAlign: 'center', marginBottom: 15 },
  mainTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 15, color: c.dark },
  hr: { borderBottomWidth: 1.5, borderBottomColor: c.primary, marginBottom: 15 },
  pageHeader: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: c.primary, marginBottom: 12, borderBottomWidth: 1.5, borderBottomColor: c.primary, paddingBottom: 5, textTransform: 'uppercase' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6, borderBottomWidth: 1.5, borderBottomColor: c.primary, paddingBottom: 4, marginTop: 10 },
  sectionTitle: { fontSize: 12, color: c.primary, fontFamily: 'Helvetica-Bold' },
  sectionRightText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.dark },

  identityContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  identityCol: { width: '48%' },
  identityRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eeeeee', paddingVertical: 5, alignItems: 'center' },
  identityLabel: { width: '40%', fontSize: 9.5, color: c.grey },
  identityValue: { width: '60%', fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: c.dark },

  discGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  discPanel: { width: '31.5%', border: '1 solid #e0e0e0', borderRadius: 3, padding: 8 },
  discPanelTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: c.grey, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  discRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  discLabel: { width: '35%', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  discBarBg: { width: '42%', height: 7, backgroundColor: '#f0f0f0', position: 'relative' },
  barFill: { height: '100%', position: 'absolute', left: 0, top: 0 },
  discVal: { width: '23%', fontSize: 7.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  hexGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  hexBox: { width: '48.5%', border: '1 solid #e0e0e0', borderRadius: 3, padding: 8, marginBottom: 8 },
  hexFactorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  hexFactorName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.dark },
  hexPctBadge: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#ffffff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  hexRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  hexRowLabel: { width: '38%', fontSize: 7.5, color: c.grey, textAlign: 'right', paddingRight: 6 },
  hexRowBar: { width: '48%', height: 6, backgroundColor: '#f0f0f0', position: 'relative' },
  hexRowPct: { width: '14%', fontSize: 7.5, textAlign: 'right', color: c.grey },

  narrativeTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: c.primary, marginBottom: 6, marginTop: 8 },
  narrativeBody: { fontSize: 10.5, lineHeight: 1.5, color: '#222222', marginBottom: 8, textAlign: 'justify' },
  bulletItem: { fontSize: 10.5, lineHeight: 1.5, color: '#333333', marginBottom: 4, paddingLeft: 10 },

  footerContainer: { position: 'absolute', bottom: 25, left: 55, right: 55, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: c.grey, fontFamily: 'Helvetica-Bold' },
});

// ==========================================
// HELPERS
// ==========================================
const hexacoStructure = [
  { factor: 'H', name: 'Kejujuran-Kerendahan Hati', color: c.hexH, facets: [{k:'sinc',n:'Ketulusan'},{k:'fair',n:'Keadilan'},{k:'gree',n:'Tanpa Keserakahan'},{k:'mode',n:'Kesederhanaan'}] },
  { factor: 'E', name: 'Emosionalitas', color: c.hexE, facets: [{k:'fear',n:'Ketakutan'},{k:'anxi',n:'Kecemasan'},{k:'depe',n:'Ketergantungan'},{k:'sent',n:'Sentimentalitas'}] },
  { factor: 'X', name: 'Ekstraversi', color: c.hexX, facets: [{k:'sses',n:'Percaya Diri Sosial'},{k:'socb',n:'Keberanian Sosial'},{k:'soci',n:'Kemudahan Bergaul'},{k:'live',n:'Semangat / Ceria'}] },
  { factor: 'A', name: 'Keramahan', color: c.hexA, facets: [{k:'forg',n:'Pemaaf'},{k:'gent',n:'Kelembutan'},{k:'flex',n:'Fleksibilitas'},{k:'pati',n:'Kesabaran'}] },
  { factor: 'C', name: 'Kesungguhan (Hati-hati)', color: c.hexC, facets: [{k:'orga',n:'Pengorganisasian'},{k:'dili',n:'Kerajinan'},{k:'perf',n:'Perfeksionisme'},{k:'prud',n:'Kehati-hatian'}] },
  { factor: 'O', name: 'Keterbukaan', color: c.hexO, facets: [{k:'aesa',n:'Apresiasi Estetika'},{k:'inqu',n:'Keingintahuan'},{k:'crea',n:'Kreativitas'},{k:'unco',n:'Originalitas'}] },
];

const getDiscPct = (raw: number) => Math.max(0, Math.min(100, (((raw || 0) + 24) / 48) * 100));
const getHexacoPct = (mean: number) => Math.max(0, Math.min(100, (((mean || 1) - 1) / 4) * 100));

const discTraits = [
  { key: 'D', name: 'Dominance', color: c.discD },
  { key: 'I', name: 'Influence', color: c.discI },
  { key: 'S', name: 'Steadiness', color: c.discS },
  { key: 'C', name: 'Compliance', color: c.discC },
];

function DiscPanel({ title, scores }: { title: string, scores: any }) {
  return (
    <View style={styles.discPanel}>
      <Text style={styles.discPanelTitle}>{title}</Text>
      {discTraits.map(({ key, name, color }) => {
        const raw = scores?.[key] || 0;
        const pct = getDiscPct(raw);
        return (
          <View style={styles.discRow} key={key}>
            <Text style={{ ...styles.discLabel, color }}>{name}</Text>
            <View style={styles.discBarBg}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.discVal}>{raw > 0 ? `+${raw}` : raw}</Text>
          </View>
        );
      })}
    </View>
  );
}

function HexacoBox({ group, factorMean, facetMeans }: { group: any, factorMean: number, facetMeans: any }) {
  const factorPct = getHexacoPct(factorMean);
  return (
    <View style={styles.hexBox}>
      <View style={styles.hexFactorHeader}>
        <Text style={styles.hexFactorName}>{group.name}</Text>
        <Text style={[styles.hexPctBadge, { backgroundColor: group.color }]}>{Math.round(factorPct)}%</Text>
      </View>
      {group.facets.map((facet: any) => {
        const fm = facetMeans?.[facet.k];
        const fp = getHexacoPct(fm);
        return (
          <View style={styles.hexRow} key={facet.k}>
            <Text style={styles.hexRowLabel}>{facet.n}</Text>
            <View style={styles.hexRowBar}>
              <View style={[styles.barFill, { width: `${fp}%`, backgroundColor: group.color, opacity: 0.6 }]} />
            </View>
            <Text style={styles.hexRowPct}>{Math.round(fp)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

function IdRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.identityRow}>
      <Text style={styles.identityLabel}>{label}</Text>
      <Text style={styles.identityValue}>{value}</Text>
    </View>
  );
}

// ==========================================
// MAIN PDF DOCUMENT
// ==========================================
interface AssessmentPDFProps {
  report: any;
  testResults: any[];
  client: any;
  ageYears: number;
  ageMonths: number;
  dateStr: string;
  aiNarrative: any;
  clientReports?: any[];
}

export default function AssessmentPDF({ report, testResults, client, ageYears, ageMonths, dateStr, aiNarrative, clientReports = [] }: AssessmentPDFProps) {
  const nameLabel = (client?.name || '-').toUpperCase();
  const instansi = client?.school_or_institution || '-';
  const role = client?.grade || '-';

  // Extract core tests
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");

  const cogScore = cogResult?.calculated_score || {};
  const discScore = discResult?.calculated_score?.calculatedData || discResult?.calculated_score || {};
  const hexacoScore = hexacoResult?.calculated_score?.calculatedData || hexacoResult?.calculated_score || {};
  const wviScore = wviResult?.calculated_score?.calculatedData || wviResult?.calculated_score || {};

  // Construct rawData mock for validity engine
  const rawDataMock = {
    userData: { durasi: "60 menit" }, // Dummy since psychoLab might track duration differently per test
    answers: hexacoResult?.raw_answers || {}
  };
  const testCodes = testResults.map(r => r.tests?.code);
  const validity = calculateValidityIndex(rawDataMock, testCodes);
  const isSuspicious = validity.overallScore !== '-' && (validity.overallScore as number) < 60;
  const validityColor = isSuspicious ? '#b91c1c' : '#166534';

  const reportData = clientReports.find(r => r.report_id === report.id);
  const finalHtml = reportData?.final_synthesis_html 
                 || cogResult?.calculated_score?.final_html 
                 || discResult?.calculated_score?.final_html;
  
  // Use aiNarrative if available, otherwise try to extract text from HTML roughly or use empty
  // Assuming aiNarrative contains empData structure (as seen in EmployeePrintView)
  const insight = aiNarrative?.empData || {};

  return (
    <Document>
      <Page size="A4" style={styles.pageWrap} wrap>
        <View style={{ textAlign: 'center', marginBottom: 10 }}>
          <Text style={styles.rahasia}>SANGAT RAHASIA</Text>
          <Text style={styles.lembaga}>Lembaga Konseling dan Psikoterapi Islam</Text>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginVertical: 4 }}>LENTERA BATIN</Text>
          <Text style={styles.address}>Jalan Potre Koneng II/31 Bumi Sumekar Asri Kolor Sumenep, Jawa Timur 69417 | www.lenterabatin.co.id</Text>
        </View>
        <View style={styles.hr} />
        <Text style={styles.mainTitle}>HASIL PEMETAAN PSIKOLOGIS</Text>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Data Responden</Text>
        </View>
        
        <View style={styles.identityContainer}>
          <View style={styles.identityCol}>
            <IdRow label="Nama Lengkap" value={nameLabel} />
            <IdRow label="No. Karyawan/NIK" value={client?.registration_number || '-'} />
            <IdRow label="Asal Instansi" value={instansi} />
            <IdRow label="Jabatan/Grade" value={role} />
          </View>
          <View style={styles.identityCol}>
            <IdRow label="Usia" value={`${ageYears} thn ${ageMonths} bln`} />
            <IdRow label="Jenis Kelamin" value={client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"} />
            <IdRow label="Tanggal Asesmen" value={dateStr} />
            <IdRow label="Kode Laporan" value={report?.token_code || "-"} />
          </View>
        </View>

        {/* KOGNITIF & WVI */}
        {((cogResult && cogScore.iq) || wviResult) && (
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
             {cogResult && cogScore.iq && (
               <View style={{ width: '48%', border: '1 solid #e0e0e0', borderRadius: 3, padding: 8 }}>
                 <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.primary, marginBottom: 6 }}>Kapasitas Kognitif ({cogResult.tests?.code})</Text>
                 <IdRow label="Skor Mentah" value={cogScore.rawScore ?? cogScore.totalRawScore ?? "-"} />
                 <IdRow label="Persentil" value={cogScore.percentile || "-"} />
                 <IdRow label="Klasifikasi IQ" value={cogScore.classification || cogScore.level?.level || "-"} />
                 <IdRow label="Estimasi IQ" value={cogScore.iq || "-"} />
               </View>
             )}
             {wviResult && Object.keys(wviScore).length > 0 && (
               <View style={{ width: '48%', border: '1 solid #e0e0e0', borderRadius: 3, padding: 8 }}>
                 <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.primary, marginBottom: 6 }}>Nilai Kerja Utama (WVI)</Text>
                 {Object.entries(wviScore)
                    .filter(([k]) => typeof wviScore[k as keyof typeof wviScore] === "number")
                    .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                    .slice(0, 4)
                    .map(([key, val]: [string, any], idx) => (
                      <View style={{ flexDirection: 'row', marginBottom: 2 }} key={idx}>
                         <Text style={{ fontSize: 8, color: c.grey, width: '60%' }}>{key.replace(/_/g, " ")}</Text>
                         <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.dark, width: '40%', textAlign: 'right' }}>{val} / 5</Text>
                      </View>
                  ))}
               </View>
             )}
           </View>
        )}

        {/* DISC */}
        {discResult && (
          <View wrap={false}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Profil Gaya Kerja (DISC)</Text>
              <Text style={styles.sectionRightText}>Pola: {getDiscPatternName(discScore.pattern)} ({discScore.pattern || discScore.archetype || '-'})</Text>
            </View>
            <View style={styles.discGrid}>
              <DiscPanel title="Grafik 1 — Publik" scores={discScore.discMost || {D: discScore.D, I: discScore.I, S: discScore.S, C: discScore.C}} />
              <DiscPanel title="Grafik 2 — Pribadi" scores={discScore.discLeast || {D: discScore.D, I: discScore.I, S: discScore.S, C: discScore.C}} />
              <DiscPanel title="Grafik 3 — Aktual" scores={discScore.discComposite || {D: discScore.D, I: discScore.I, S: discScore.S, C: discScore.C}} />
            </View>
          </View>
        )}

        {/* HEXACO */}
        {hexacoResult && hexacoScore.factorMeans && (
          <View wrap={false}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Profil Karakter (HEXACO)</Text>
              <Text style={{...styles.sectionRightText, color: validityColor}}>Validitas: {validity.overallLabel} ({validity.overallScore}/100)</Text>
            </View>
            <View style={styles.hexGrid}>
              {hexacoStructure.map((group) => (
                <HexacoBox
                  key={group.factor}
                  group={group}
                  factorMean={hexacoScore.factorMeans?.[group.factor]}
                  facetMeans={hexacoScore.facetMeans}
                />
              ))}
              {/* Altruisme */}
              {hexacoScore.facetMeans?.['altr'] && (
                <View style={{ ...styles.hexBox, width: '100%', marginBottom: 0, flexDirection: 'row', alignItems: 'center' }}>
                   <Text style={{...styles.hexFactorName, width: '40%'}}>Altruisme (Tambahan)</Text>
                   <View style={{...styles.hexRowBar, width: '45%'}}>
                      <View style={[styles.barFill, { width: `${getHexacoPct(hexacoScore.facetMeans['altr'])}%`, backgroundColor: '#e67e22' }]} />
                   </View>
                   <Text style={{...styles.hexPctBadge, backgroundColor: '#e67e22', marginLeft: 'auto'}}>{Math.round(getHexacoPct(hexacoScore.facetMeans['altr']))}%</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Page>

      {/* PAGE 2 - NARASI AI */}
      {(insight.deskripsiTerintegrasi || insight.rekomendasiAkhir) && (
        <Page size="A4" style={styles.pageWrap} wrap>
          <Text style={styles.pageHeader}>DESKRIPSI KEPRIBADIAN TERPADU</Text>

          {insight.deskripsiTerintegrasi && (
            <View wrap={false} style={{ marginBottom: 6 }}>
              <Text style={{...styles.narrativeTitle, marginTop: 0}}>1. Deskripsi Kepribadian Terintegrasi</Text>
              <Text style={styles.narrativeBody}>{insight.deskripsiTerintegrasi}</Text>
            </View>
          )}

          {insight.kekuatanUtama && insight.kekuatanUtama.length > 0 && (
            <View wrap={false} style={{ marginBottom: 6 }}>
              <Text style={styles.narrativeTitle}>2. Kekuatan Utama</Text>
              {insight.kekuatanUtama.map((k: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>• {k}</Text>
              ))}
            </View>
          )}

          {insight.lingkunganIdeal?.ekosistemKerja && (
             <View wrap={false} style={{ marginBottom: 6 }}>
              <Text style={styles.narrativeTitle}>3. Lingkungan Berkembang Optimal</Text>
              <Text style={styles.narrativeBody}>{insight.lingkunganIdeal.ekosistemKerja}</Text>
            </View>
          )}

          {insight.saranPengembangan && insight.saranPengembangan.length > 0 && (
            <View wrap={false} style={{ marginBottom: 6 }}>
              <Text style={styles.narrativeTitle}>4. Saran Pengembangan</Text>
              {insight.saranPengembangan.map((k: string, i: number) => (
                 <Text key={i} style={styles.bulletItem}>• {k}</Text>
              ))}
            </View>
          )}

          {insight.rekomendasiAkhir && (
            <View wrap={false} style={{ marginTop: 15, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#f97316', backgroundColor: '#fff7ed' }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#c2410c', marginBottom: 6 }}>
                Rekomendasi Akhir — {client?.grade || 'Posisi Umum'}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ea580c', marginBottom: 6, textTransform: 'uppercase' }}>
                {insight.rekomendasiAkhir.status} (Job Fit: {insight.rekomendasiAkhir.persentaseJobFit}%)
              </Text>
              <Text style={{ fontSize: 10, color: '#9a3412', lineHeight: 1.5, textAlign: 'justify' }}>
                {insight.rekomendasiAkhir.keterangan}
              </Text>
            </View>
          )}

          {/* Signature Box */}
          <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 20 }}>
            <View style={{ width: '50%', alignItems: 'center' }}>
              <Text style={{ fontSize: 9.5, color: c.dark, marginBottom: 30 }}>Sumenep, {dateStr}</Text>
              <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: c.dark, marginBottom: 2 }}>Psikolog / Asesor Pemeriksa</Text>
              <Text style={{ fontSize: 8.5, color: c.grey }}>SIPP: ___________________</Text>
            </View>
          </View>

          {/* Footer */}
          <View fixed style={styles.footerContainer}>
            <Text render={({ pageNumber }) => `Hal. ${pageNumber}`} style={styles.footerText} />
            <Text style={styles.footerText}>{nameLabel}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
