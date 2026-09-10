import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ConflictFlag, ReportContext, AssessmentPayload } from '@/lib/services/conflictEngine';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateNarrativeRequest {
  clientName: string;
  context: ReportContext;
  rawPayload: AssessmentPayload;
  conflictFlags: ConflictFlag[];
  observationData?: {
    observation?: Record<string, any>;
    anamnesa?: Record<string, string>;
    impression?: Record<string, any>;
    notes?: string;
  } | null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateNarrativeRequest;
    const { clientName, context, rawPayload, conflictFlags, observationData } = body;

    // --- Format data observasi menjadi teks untuk injeksi AI ---
    let observationBlock = "";
    if (observationData) {
      const lines: string[] = ["[DATA OBSERVASI PSIKOLOG — Tidak dipublikasikan ke klien]"];

      // A. Observasi perilaku tes
      const obs = observationData.observation || {};
      const obsChecked: string[] = [];
      const obsMap: Record<string, string> = {
        fokus: "Fokus sepanjang sesi", gelisah: "Tampak gelisah", ngantuk: "Tampak mengantuk",
        ponsel: "Mencoba menggunakan ponsel ⚠", persist: "Resiliensi tinggi saat soal sulit",
        menyerah: "Mudah menyerah ⚠", frustrasi: "Tampak frustrasi ⚠", tenang: "Tenang saat soal sulit",
        sungguh: "Mengerjakan dengan sungguh-sungguh", asal: "Menjawab asal-asalan ⚠",
        curang: "Indikasi curang ⚠"
      };
      Object.entries(obsMap).forEach(([key, label]) => { if (obs[key]) obsChecked.push(label); });
      if (obs.speed) lines.push(`- Kecepatan pengerjaan: ${obs.speed}`);
      if (obs.compliance) lines.push(`- Kepatuhan instruksi: ${obs.compliance}`);
      if (obsChecked.length) lines.push(`- Perilaku yang teramati: ${obsChecked.join(", ")}`);
      if (obs.obs_notes) lines.push(`- Catatan perilaku: ${obs.obs_notes}`);

      // B. Anamnesa
      const ana = observationData.anamnesa || {};
      const anaMap: Record<string, string> = {
        alasan: "Alasan melamar", riwayat: "Riwayat pekerjaan & alasan keluar",
        tekanan: "Pengalaman tekanan/konflik kerja", gaji: "Ekspektasi gaji",
        karir: "Rencana karir 3-5 tahun", kekuatan: "Kekuatan diri", kelemahan: "Kelemahan yang dikembangkan",
        integritas: "Integritas & Keputusan Etis", tim: "Peran dalam Tim", kritik: "Menerima Umpan Balik/Kritik"
      };
      const anaLines: string[] = [];
      Object.entries(anaMap).forEach(([key, label]) => {
        const ans = ana[`${key}_ans`]; const int = ana[`${key}_int`];
        if (ans || int) {
          anaLines.push(`  • ${label}: ${ans || "-"} ${int ? `[Interpretasi: ${int}]` : ""}`);
        }
      });
      // Membaca input dinamis custom
      const customKeys = Object.keys(ana)
        .filter(k => k.startsWith("custom_") && k.endsWith("_label"))
        .map(k => k.replace("_label", ""));
      customKeys.forEach(kKey => {
        const label = ana[`${kKey}_label`];
        const ans = ana[`${kKey}_ans`];
        const int = ana[`${kKey}_int`];
        if (label && (ans || int)) {
          anaLines.push(`  • ${label}: ${ans || "-"} ${int ? `[Interpretasi: ${int}]` : ""}`);
        }
      });
      if (anaLines.length) { lines.push("- Anamnesa Karir:"); lines.push(...anaLines); }

      // C. Kesan umum
      const imp = observationData.impression || {};
      const impLabels: Record<string, string> = {
        appearance: "Penampilan", communication: "Komunikasi verbal",
        confidence: "Kepercayaan diri", culturefit: "Kesesuaian kultur"
      };
      const impLines: string[] = [];
      Object.entries(impLabels).forEach(([key, label]) => {
        const score = imp[`${key}_score`]; const note = imp[`${key}_note`];
        if (score || note) impLines.push(`  • ${label}: ${score ? `${score}/5` : "-"} ${note ? `— ${note}` : ""}`);
      });
      if (impLines.length) { lines.push("- Kesan Umum Kandidat:"); lines.push(...impLines); }
      if (imp.overall) lines.push(`- Kesan keseluruhan: ${imp.overall}`);

      // D. Red flag & catatan bebas
      const rfMap: Record<string, string> = {
        rf_inkonsisten: "Inkonsistensi tes vs perilaku ⚠",
        rf_emosi: "Regulasi emosi kurang stabil ⚠",
        rf_bohong: "Indikasi ketidakjujuran ⚠",
        rf_risiko: "Ada faktor risiko personal ⚠"
      };
      const rfChecked: string[] = [];
      Object.entries(rfMap).forEach(([key, label]) => { if (obs[key]) rfChecked.push(label); });
      if (rfChecked.length) lines.push(`- Red Flag Klinis: ${rfChecked.join(", ")}`);
      if (observationData.notes) lines.push(`- Catatan psikolog: ${observationData.notes}`);

      observationBlock = lines.join("\n");
    }
    
    // 1. Pemetaan Konteks Laporan untuk Sistem AI
    const contextGuidelines = {
      CHILD: "Fokus pada dinamika tumbuh kembang, keselarasan pengasuhan, regulasi emosi dasar, serta dinamika belajar dan kesimpulan kematangan dan ketahanan belajar di sekolah.",
      STUDENT: "Fokus pada rekomendasi penjurusan (IPA/IPS/Bahasa/Kejuruan), realisme minat bakat, ketahanan belajar, dan berikan 3 saran bidang jurusan kuliah dan karier di masa depan.",
      EMPLOYEE: "Fokus pada kapabilitas profesional, ketahanan stres, dan culture fit di tempat kerja."
    };

    // 2. Persona Sistem (Menggabungkan Psikologi Modern & Ghazalian)
    const systemInstruction = `
      Anda adalah seorang Psikolog Senior dan Asesor Klinis di Lentera Batin. Pendekatan Anda sangat holistik: Anda tidak hanya memetakan permukaan kognitif (Aql) dan perilaku sadar (Nafs), tetapi juga mempertimbangkan dinamika batin (Qalb).
      
      TUGAS ANDA:
      Menulis "Sintesis Diagnostik" untuk klien berdasarkan data tes dan peringatan klinis.
      Target Analisis: ${contextGuidelines[context]}
      
      ATURAN FORMAT (STRICT RULES):
      1. Output HARUS murni dalam format HTML (gunakan <h2>, <h3>, <p>, <ul>, <li>, <strong>).
      2. JANGAN gunakan tag pembungkus Markdown seperti \`\`\`html. Langsung mulai dengan <h2>.
      3. Terjemahkan angka/skor menjadi deskripsi perilaku. Jangan menulis "Skor Raven 92" atau "HEXACO E 40", melainkan "Kapasitas penalaran abstrak berada pada taraf rata-rata" atau "Memiliki kecenderungan introvert".
      4. Bahasa harus profesional, empatik, memberdayakan, dan tidak menghakimi.
    `;

    // 3. Injeksi Conflict Engine (Validasi Silang)
    let conflictInstructions = "";
    if (conflictFlags.length > 0) {
      conflictInstructions = `
        [PERHATIAN KLINIS - VALIDASI SILANG]
        Sistem mendeteksi adanya dinamika yang memerlukan mitigasi atau kompensasi:
        ${JSON.stringify(conflictFlags, null, 2)}
        
        INSTRUKSI SINTESIS KONFLIK:
        Sebagai penengah klinis, integrasikan anomali ini ke dalam narasi. Jika ini terkait penjurusan siswa, gunakan ini sebagai dasar rekomendasi IPA/IPS atau area pengembangannya. Gunakan istilah psikologis yang empatik (misal: "strategi adaptasi", "tantangan regulasi", "risiko kelelahan sosial"). Jelaskan dengan bijak mengapa jarak antara harapan (atau minat) dan realitas kapasitas ini terjadi, serta berikan rekomendasi penyelarasan.
      `;
    } else {
      conflictInstructions = `
        [VALIDASI SILANG]
        Data menunjukkan konsistensi yang baik antara kapasitas dan minat klien. Tegaskan keselarasan karakter ini dalam narasi dan berikan rekomendasi pengembangan yang optimal.
      `;
    }

    // 4. Merakit Prompt Pengguna
    const userPrompt = `
      Nama Klien: ${clientName}
      
      ${observationBlock ? `${observationBlock}\n` : ""}
      [RINGKASAN DATA MENTAH]
      ${JSON.stringify(rawPayload, null, 2)}
      
      ${conflictInstructions}
      
      Silakan susun draf HTML dengan struktur berikut:
      <h2>Dinamika Psikologis &amp; Kapasitas</h2>
      <p>...</p>
      <h2>Area Refleksi &amp; Potensi Risiko</h2>
      <ul>...</ul>
      <h2>Rekomendasi (Intervensi / Penjurusan)</h2>
      <p>...</p>
    `;

    // 5. Eksekusi ke LLM
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.65,
      }
    });
    
    const responseText = result.response.text();
    // Bersihkan markdown block jika AI tetap membandel
    const cleanHtml = responseText.replace(/```html/g, '').replace(/```/g, '').trim();

    // 6. Mengembalikan respons HTML ke Frontend
    return NextResponse.json({ htmlContent: cleanHtml });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyintesis draf laporan." }, 
      { status: 500 }
    );
  }
}
