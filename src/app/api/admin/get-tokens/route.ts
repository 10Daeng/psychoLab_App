import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: tokensData, error } = await supabaseAdmin
      .from("tokens")
      .select(`
        id, token_code, is_used, created_at, status, purpose, respondent_type,
        clients (name),
        observations (id)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error('get-tokens db error:', error);
      return NextResponse.json({ success: false, error: 'Gagal mengambil data dari database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tokens: tokensData });
  } catch (error: any) {
    console.error('get-tokens error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
