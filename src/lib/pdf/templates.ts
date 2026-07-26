import jsPDF from 'jspdf';

export type SegmentType = 'CHI' | 'STU' | 'EMP';

export interface ReportData {
  client: any;
  tokenCode: string;
  segment: SegmentType;
  cognitive?: any;
  personality?: any;
  results?: any;
  aiNarrative?: string;
  recommendations?: string;
  date?: string;
}

export const generateLenteraBatinPDF = async (data: ReportData): Promise<string> => {
  const { client, tokenCode, segment, aiNarrative, recommendations } = data;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const brandColor = segment === 'CHI' ? '#f97316' : segment === 'STU' ? '#14b8a6' : '#7c3aed';

  let y = 20;

  // Header dengan Logo Style
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("LENTERA", 25, 28);
  doc.setFontSize(24);
  doc.setTextColor(245, 158, 11);
  doc.text("BATIN", 72, 28);

  doc.setFontSize(10);
  doc.setTextColor(165, 243, 252);
  doc.text("ASSESSMENT", 25, 38);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(tokenCode, pageWidth - 30, 18, { align: "right" });

  y = 65;

  // Segment Title
  const segmentTitles = {
    CHI: "LAPORAN ASESMEN PSIKOLOGI ANAK",
    STU: "LAPORAN PENJURUSAN & PENGEMBANGAN BAKAT",
    EMP: "LAPORAN ASESMEN REKRUTMEN & EXECUTIVE SUMMARY"
  };

  doc.setFontSize(16);
  doc.setTextColor(...hexToRgb(brandColor));
  doc.text(segmentTitles[segment], pageWidth / 2, y, { align: "center" });
  y += 12;

  // Client Info
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Nama", 25, y);
  doc.text(": " + (client?.name || "-"), 70, y);
  y += 8;

  doc.text("Usia", 25, y);
  doc.text(": " + (client?.age ? client.age + " tahun" : "-"), 70, y);
  y += 8;

  if (client?.school_or_institution) {
    doc.text("Instansi", 25, y);
    doc.text(": " + client.school_or_institution, 70, y);
    y += 8;
  }

  y += 15;

  // Content based on segment
  if (segment === 'CHI') {
    doc.setFontSize(13);
    doc.setTextColor(249, 115, 22);
    doc.text("PROFIL PERKEMBANGAN ANAK", 25, y);
    y += 12;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const chiText = aiNarrative || "Anak menunjukkan kemampuan visual dan pemecahan masalah yang baik. Direkomendasikan stimulasi lebih lanjut di area konsentrasi dan kreativitas.";
    const splitText = doc.splitTextToSize(chiText, 160);
    doc.text(splitText, 25, y);
    y += splitText.length * 6 + 10;

    doc.setTextColor(234, 88, 12);
    doc.text("REKOMENDASI UNTUK ORANG TUA:", 25, y);
    y += 10;
    doc.setTextColor(51, 65, 85);
    const recs = recommendations || "• Mainkan permainan puzzle dan pola\n• Baca buku cerita setiap hari\n• Berikan pujian spesifik saat anak berhasil";
    const recSplit = doc.splitTextToSize(recs, 160);
    doc.text(recSplit, 30, y);

  } else if (segment === 'STU') {
    doc.setFontSize(13);
    doc.setTextColor(45, 212, 191);
    doc.text("PROFIL BAKAT & REKOMENDASI JURUSAN", 25, y);
    y += 15;

    doc.setFontSize(11);
    doc.text("Visualisasi Radar Chart Bakat dan Minat akan ditampilkan pada PDF final.", 25, y);
    y += 20;

    doc.setTextColor(15, 23, 42);
    const stuText = aiNarrative || "Siswa memiliki kombinasi kekuatan di area logika dan kreativitas. Rekomendasi jurusan yang sesuai adalah IPA, Teknik, atau Desain.";
    const splitSTU = doc.splitTextToSize(stuText, 160);
    doc.text(splitSTU, 25, y);
    y += splitSTU.length * 7 + 10;

  } else if (segment === 'EMP') {
    doc.setFontSize(15);
    doc.setTextColor(124, 58, 237);
    doc.text("EXECUTIVE SUMMARY", 25, y);
    y += 12;

    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text("RED FLAGS:", 25, y);
    y += 8;
    doc.text("• Perlu verifikasi lebih lanjut pada aspek integritas", 30, y);
    y += 12;

    doc.setTextColor(22, 101, 52);
    doc.text("STRENGTHS:", 25, y);
    y += 8;
    doc.text("• Kepemimpinan yang kuat\n• Kemampuan analisis data yang baik", 30, y);
    y += 18;
  }

  // Signature
  y = 240;
  doc.setFontSize(11);
  doc.text("Sumenep, " + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 120, y);
  y += 25;
  doc.text("___________________________", 120, y);
  y += 8;
  doc.setFontSize(10);
  doc.text("Psikolog / Assessor", 130, y);

  // Final Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Dokumen rahasia milik Lentera Batin Assessment", pageWidth/2, 285, { align: "center" });
  doc.text("www.lenterabatin.co.id", pageWidth/2, 290, { align: "center" });

  const filename = `${new Date().toISOString().slice(2,10).replace(/-/g,'')}_${segment}_${client.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Laporan'}.pdf`;
  doc.save(filename);

  return filename;
};

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// Helper function for React components
export const downloadPDF = (data: ReportData) => {
  return generateLenteraBatinPDF(data);
};
