import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ConflictFlag, ReportContext, AssessmentPayload } from '@/lib/services/conflictEngine';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateNarrativeRequest {
  clientName: string;
  context: ReportContext;
  rawPayload: AssessmentPayload;
  conflictFlags: ConflictFlag[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateNarrativeRequest;
    const { clientName, context, rawPayload, conflictFlags } = body;
    
    // 1. Pemetaan Konteks Laporan untuk Sistem AI
    const contextGuidelines = {
      CHILD: "Fokus pada dinamika tumbuh kembang, keselarasan pengasuhan, dan regulasi emosi dasar.",
      STUDENT: "Fokus pada rekomendasi penjurusan (IPA/IPS/Bahasa/Kejuruan), realisme minat bakat, dan ketahanan belajar.",
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
      
      [RINGKASAN DATA MENTAH]
      ${JSON.stringify(rawPayload, null, 2)}
      
      ${conflictInstructions}
      
      Silakan susun draf HTML dengan struktur berikut:
      <h2>Dinamika Psikologis & Kapasitas</h2>
      <p>...</p>
      <h2>Area Refleksi & Potensi Risiko</h2>
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
