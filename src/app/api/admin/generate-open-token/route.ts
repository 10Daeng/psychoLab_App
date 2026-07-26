import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { token_code, test_ids, respondent_type, purpose } = await request.json();

    if (!token_code || !test_ids || test_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tokens')
      .insert({
        token_code,
        test_ids,
        respondent_type: respondent_type || 'SELF',
        purpose: purpose || 'ASESMEN_UMUM',
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
