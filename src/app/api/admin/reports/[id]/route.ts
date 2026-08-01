import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const { data: tokenData, error: err1 } = await supabase
      .from("tokens")
      .select("*, clients(*), observations(*)")
      .eq("id", id)
      .single();

    if (err1) throw err1;

    const { data: results, error: err2 } = await supabase
      .from("test_results")
      .select("*, tests(code, name)")
      .eq("token_id", id);

    if (err2) throw err2;

    return NextResponse.json({
      report: tokenData,
      testResults: results || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
