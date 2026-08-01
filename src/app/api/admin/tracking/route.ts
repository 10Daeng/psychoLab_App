import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: childTokens, error: err1 } = await supabase
      .from("tokens")
      .select("id, token_code, status, clients(name)")
      .eq("respondent_type", "SELF")
      .eq("purpose", "CHILD")
      .order("created_at", { ascending: false });

    if (err1) throw err1;

    const { data: parentTokens, error: err2 } = await supabase
      .from("tokens")
      .select("id, token_code, status, parent_token_id")
      .eq("respondent_type", "PARENT")
      .eq("purpose", "CHILD");

    if (err2) throw err2;

    return NextResponse.json({
      childTokens: childTokens || [],
      parentTokens: parentTokens || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
