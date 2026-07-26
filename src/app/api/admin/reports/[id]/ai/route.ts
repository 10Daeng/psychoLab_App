import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EngineFactory } from '@/lib/engines/engine_factory';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: childTokenId } = await params;

    // 1. Ambil Token Anak dan Data Klien
    const { data: childToken } = await supabase
      .from('tokens')
      .select('id, client_id, clients(*)')
      .eq('id', childTokenId)
      .single();

    if (!childToken) return NextResponse.json({ error: 'Token anak tidak ditemukan' }, { status: 404 });

    // 2. Ambil Hasil Tes CPM Anak
    const { data: childResult } = await supabase
      .from('test_results')
      .select('raw_data, calculated_data')
      .eq('token_id', childTokenId)
      .single();

    if (!childResult) return NextResponse.json({ error: 'Hasil tes CPM anak belum ada' }, { status: 404 });

    // 3. Cari Token Orang Tua
    const { data: parentToken } = await supabase
      .from('tokens')
      .select('id, status')
      .eq('parent_token_id', childTokenId)
      .single();

    // 4. Jika Ortu ada, ambil datanya dari kuesioner
    let parentData: any = null;
    if (parentToken) {
      // Ambil respon kuesioner
      const { data: qResponses } = await supabase
        .from('questionnaire_responses')
        .select(`
          answer_value,
          questions (
            question_text,
            questionnaires (
              code,
              title
            )
          )
        `)
        .eq('token_id', parentToken.id);
      
      if (qResponses && qResponses.length > 0) {
        parentData = {};
        qResponses.forEach((r: any) => {
          const qText = r.questions?.question_text;
          const code = r.questions?.questionnaires?.code;
          if (qText && code) {
            if (!parentData[code]) parentData[code] = {};
            
            // Format jawaban (misal "0=Tidak Pernah" menjadi "Tidak Pernah")
            let answerText = r.answer_value;
            if (answerText.includes('=')) {
              answerText = answerText.split('=')[1].trim();
            }
            
            parentData[code][qText] = answerText;
          }
        });
      }
    }

    // 5. Susun Prompt via CPM Engine
    const cpmEngine = EngineFactory.getEngine("CPM");
    let basePrompt = cpmEngine.buildAiPrompt(
      childResult.calculated_data, 
      childToken.clients, 
      parentData
    );

    // 6. INSTRUKSI JSON (Override untuk Dashboard Ultimate)
    const jsonInstruction = `
\n\n=== PENTING: FORMAT OUTPUT ===
Anda WAJIB merespons HANYA dengan format JSON murni (tanpa tag \`\`\`json). 
Gunakan skema JSON persis seperti berikut:
{
  "executive_summary": "Ringkasan eksekutif 2-3 kalimat tentang kesiapan belajar dan kapasitas kognitif anak.",
  "kekuatan_kognitif": ["Poin kekuatan 1", "Poin kekuatan 2"],
  "tantangan_kognitif": ["Poin tantangan 1", "Poin tantangan 2"],
  "kondisi_sosial_emosional": "Paragraf naratif yang menggabungkan hasil observasi orang tua (SDQ & ABIC) dengan performa tes. Jika tidak ada data ortu, tulis 'Data observasi orang tua belum tersedia.'",
  "saran_belajar_sekolah": ["Saran praktis untuk guru 1", "Saran praktis untuk guru 2"],
  "saran_pengasuhan_rumah": ["Saran praktis untuk orang tua 1", "Saran praktis untuk orang tua 2"],
  "peringatan_khusus": "Isi dengan peringatan jika validitas meragukan (misal lompatan skor ekstrem) atau butuh intervensi klinis. Jika aman, isi dengan string kosong ''."
}`;

    const finalPrompt = basePrompt + jsonInstruction;

    // 7. Hit Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(finalPrompt);
    let text = result.response.text();
    
    // Clean up markdown JSON tags if Gemini disobeys
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    let aiInsight;
    try {
      aiInsight = JSON.parse(text);
    } catch (parseError) {
      console.error("Gagal parse JSON dari AI:", text);
      return NextResponse.json({ error: 'AI mengembalikan format yang salah.' }, { status: 500 });
    }

    // (Opsional) Di tahap produksi, insight ini bisa di-save ke database agar tidak perlu dipanggil berulang kali.
    // Tapi karena ini fase 1.9, kita biarkan fetch real-time.

    return NextResponse.json({ success: true, aiInsight });

  } catch (error: any) {
    console.error("API AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
