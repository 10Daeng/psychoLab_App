import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { decryptClientData } from '@/lib/encryption';

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

    const { data: clientReports, error: err3 } = await supabase
      .from("client_reports")
      .select("*")
      .eq("report_id", id);
      
    if (err3 && err3.code !== '42P01') {
      console.warn("client_reports error (or table missing):", err3);
    }

    if (tokenData && tokenData.clients) {
      tokenData.clients = decryptClientData(tokenData.clients);
    }

    return NextResponse.json({
      report: tokenData,
      testResults: results || [],
      clientReports: clientReports || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
