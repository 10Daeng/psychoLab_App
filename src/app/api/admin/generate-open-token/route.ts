import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { token_code, test_ids, respondent_type, purpose } = await request.json();

    if (!token_code || !test_ids || test_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const insertData: any = {
      token_code,
      test_ids,
      respondent_type: respondent_type || 'SELF',
      purpose: purpose || 'ASESMEN_UMUM',
      status: 'PENDING'
    };

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      insertData.organization_id = payload.organization_id;
    }

    const { data, error } = await supabaseAdmin
      .from('tokens')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("generate-open-token db error:", error);
      return NextResponse.json({ success: false, error: "Gagal membuat token di database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: data });
  } catch (error: any) {
    console.error("generate-open-token error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan internal." }, { status: 500 });
  }
}
