import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Kode tes tidak ditemukan' }, { status: 400 });
  }

  try {
    // 1. Dapatkan ID Kuesioner
    const { data: qData, error: qErr } = await supabase
      .from('questionnaires')
      .select('id, total_questions')
      .eq('code', code.toUpperCase())
      .single();

    if (qErr || !qData) {
      return NextResponse.json({ error: 'Tes tidak ditemukan' }, { status: 404 });
    }

    // 2. Dapatkan Soal tanpa kolom sensitif correct_answer
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_number, question_text, image_url, response_options, question_category, scoring_key')
      .eq('questionnaire_id', qData.id)
      .order('question_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Format soal sesuai kebutuhan frontend
    const formattedQuestions = questions.map((q) => {
      let options = [];
      try {
        options = JSON.parse(q.response_options);
      } catch (e) {
        options = q.response_options ? q.response_options.split(',') : [];
      }
      
      return {
        id: String(q.question_number),
        db_id: q.id,
        problemImage: q.image_url, // Khusus CPM/RAVEN
        text: q.question_text,
        category: q.question_category, // Khusus SDS (section), DISC (category)
        options: options
        // PERHATIAN: correct_answer & scoring_key TIDAK DIKIRIMKAN KE FRONTEND!
      };
    });

    return NextResponse.json(formattedQuestions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
