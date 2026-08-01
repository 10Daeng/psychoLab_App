import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { jwtVerify } from "jose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      await jwtVerify(sessionCookie.value, secret);
    } catch (e) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');
    const clientId = searchParams.get('clientId');
    const { code: qCode } = await params;

    if (!tokenId || !clientId || !qCode) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Ambil kuesioner
    const { data: qData, error: qErr } = await supabase
      .from("questionnaires")
      .select("*")
      .eq("code", qCode)
      .single();
      
    if (qErr || !qData) {
      return NextResponse.json({ error: "Kuesioner tidak ditemukan." }, { status: 404 });
    }

    // 2. Ambil soal
    const { data: qsData, error: qsErr } = await supabase
      .from("questions")
      .select("*")
      .eq("questionnaire_id", qData.id)
      .order("question_number", { ascending: true });
      
    if (qsErr) throw qsErr;

    // 3. Ambil jawaban sebelumnya jika ada
    const { data: respData } = await supabase
      .from("questionnaire_responses")
      .select("question_id, answer_value")
      .eq("token_id", tokenId)
      .eq("questionnaire_id", qData.id);

    // 4. Ambil atau buat progress
    let { data: progData } = await supabase
      .from("questionnaire_progress")
      .select("*")
      .eq("token_id", tokenId)
      .eq("questionnaire_id", qData.id)
      .single();

    if (!progData) {
      const { data: newProg } = await supabase
        .from("questionnaire_progress")
        .insert({
          token_id: tokenId,
          client_id: clientId,
          questionnaire_id: qData.id,
          total_questions: qData.total_questions,
          status: "in_progress",
          last_page: 1
        })
        .select()
        .single();
        
      progData = newProg;
    }

    return NextResponse.json({
      questionnaire: qData,
      questions: qsData || [],
      responses: respData || [],
      progress: progData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const { upsertData, progressUpdate, progressId } = await req.json();

    if (upsertData && upsertData.length > 0) {
      const { error: upsertErr } = await supabase
        .from("questionnaire_responses")
        .upsert(upsertData, { onConflict: "token_id,question_id" });

      if (upsertErr) throw upsertErr;
    }

    if (progressUpdate && progressId) {
      const { error: progErr } = await supabase
        .from("questionnaire_progress")
        .update(progressUpdate)
        .eq("id", progressId);
        
      if (progErr) throw progErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
