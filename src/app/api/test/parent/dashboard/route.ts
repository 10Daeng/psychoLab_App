import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { jwtVerify } from "jose";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sesi tidak valid. Akses ditolak." }, { status: 401 });
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      await jwtVerify(sessionCookie.value, secret);
    } catch (e) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const { data: qData, error: qErr } = await supabase
      .from("questionnaires")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (qErr) throw qErr;

    const { data: progData, error: progErr } = await supabase
      .from("questionnaire_progress")
      .select("*")
      .eq("token_id", tokenId);
    
    if (progErr) throw progErr;

    return NextResponse.json({
      questionnaires: qData || [],
      progress: progData || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
