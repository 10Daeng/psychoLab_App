import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';
import { decryptClientData } from '@/lib/encryption';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const purpose = searchParams.get('purpose');

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    let query = supabase
      .from("tokens")
      .select("id, token_code, created_at, clients(*), status, respondent_type")
      .eq("respondent_type", "SELF")
      .eq("purpose", purpose)
      .order("created_at", { ascending: false });

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      query = query.eq('organization_id', payload.organization_id);
    }

    const { data: childTokens, error } = await query;

    if (error) throw error;

    const parentTokenIds = childTokens?.map((ct: any) => ct.id) || [];

    let parentTokens: any[] = [];
    if (parentTokenIds.length > 0) {
      const { data } = await supabase
        .from("tokens")
        .select("id, parent_token_id, status")
        .in("parent_token_id", parentTokenIds);
      parentTokens = data || [];
    }

    const decryptedChildTokens = childTokens?.map((ct: any) => ({
      ...ct,
      clients: ct.clients ? decryptClientData(ct.clients) : ct.clients
    })) || [];

    return NextResponse.json({
      childTokens: decryptedChildTokens,
      parentTokens: parentTokens || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
