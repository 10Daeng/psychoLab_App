import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token_id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token_id } = await params;
    if (!token_id) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("token_code, client_id, clients(*)")
      .eq("id", token_id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 404 });
    }

    const { data: dapData } = await supabase
      .from("dap_assessments")
      .select("*")
      .eq("token_id", token_id)
      .single();

    return NextResponse.json({
      tokenData,
      dapData: dapData || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token_id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token_id } = await params;
    const payload = await req.json();

    const { data: existing } = await supabase
      .from("dap_assessments")
      .select("id")
      .eq("token_id", token_id)
      .single();

    if (existing) {
      const { error } = await supabase.from("dap_assessments").update(payload).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("dap_assessments").insert(payload);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
