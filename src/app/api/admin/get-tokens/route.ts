import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';
import { decrypt } from '@/lib/encryption';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let query = supabaseAdmin
      .from("tokens")
      .select(`
        id, token_code, is_used, created_at, status, purpose, respondent_type,
        clients (name),
        observations (id)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      query = query.eq('organization_id', payload.organization_id);
    }

    const { data: tokensData, error } = await query;

    if (error) {
      console.error('get-tokens db error:', error);
      return NextResponse.json({ success: false, error: 'Gagal mengambil data dari database.' }, { status: 500 });
    }

    const decryptedTokens = tokensData?.map((t: any) => {
      if (t.clients && t.clients.name) {
        t.clients.name = decrypt(t.clients.name);
      }
      return t;
    });

    return NextResponse.json({ success: true, tokens: decryptedTokens });
  } catch (error: any) {
    console.error('get-tokens error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
