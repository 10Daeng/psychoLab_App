import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';
import { encryptClientData, decryptClientData } from '@/lib/encryption';

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
      .from('clients')
      .select('*, tokens(id, token_code, status, respondent_type)')
      .eq('test_purpose', purpose)
      .order('created_at', { ascending: false });

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      query = query.eq('organization_id', payload.organization_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const decryptedData = data?.map((client: any) => decryptClientData(client));
    
    return NextResponse.json(decryptedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let clientsToInsert = await req.json();

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      clientsToInsert = clientsToInsert.map((c: any) => ({
        ...c,
        organization_id: payload.organization_id
      }));
    }

    clientsToInsert = clientsToInsert.map((c: any) => encryptClientData(c));

    const { error } = await supabase
      .from('clients')
      .insert(clientsToInsert);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
