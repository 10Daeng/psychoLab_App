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

    const { data: childTokens, error } = await supabase
      .from("tokens")
      .select("id, token_code, created_at, clients(*), status")
      .eq("respondent_type", "SELF")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const tokenIds = childTokens?.map((ct: any) => ct.id) || [];
    let dapRecords: any[] = [];
    
    if (tokenIds.length > 0) {
      const { data: dapData } = await supabase
        .from("dap_assessments")
        .select("token_id, score, cognitive_maturity_level")
        .in("token_id", tokenIds);
      dapRecords = dapData || [];
    }

    return NextResponse.json({
      tokens: childTokens || [],
      dapRecords: dapRecords
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
