'use client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AssessmentPDF from './AssessmentPDF';

interface PDFExportProps {
  report: any;
  testResults: any[];
  client: any;
  ageYears: number;
  ageMonths: number;
  dateStr: string;
  aiNarrative: any;
  clientReports?: any[];
}

export default function PDFExport(props: PDFExportProps) {
  // Only render PDFDownloadLink when critical data is ready
  if (!props.client?.name || !props.dateStr) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-500 font-medium py-2 px-6 rounded-lg text-sm opacity-50 cursor-not-allowed"
      >
        Memuat data PDF...
      </button>
    );
  }

  const fileName = `${(props.client?.name || 'Klien').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')}_${(props.client?.school_or_institution || 'Instansi').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')}.pdf`;

  return (
    <PDFDownloadLink 
      document={<AssessmentPDF {...props} />}
      fileName={fileName}
      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-md transition-all duration-300"
    >
      {({ loading }) => (loading ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF (Cetak)')}
    </PDFDownloadLink>
  );
}
