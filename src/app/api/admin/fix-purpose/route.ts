import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';

// ONE-TIME DATA FIX ENDPOINT
// Memperbaiki test_purpose yang salah/null di tabel clients
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAdminSession(session.value);
    if (!payload || payload.role !== 'Super_Admin') {
      return NextResponse.json({ error: 'Super_Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { targetPurpose = 'CHILD' } = body;

    // Ambil semua klien yang test_purpose-nya bukan EMP, STU, atau CHILD
    const { data: badClients, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, test_purpose')
      .not('test_purpose', 'in', '("EMP","STU","CHILD")');

    if (fetchError) throw fetchError;

    console.log(`[fix-purpose] Klien dengan test_purpose tidak valid: ${badClients?.length ?? 0}`);
    console.log('[fix-purpose] Sample:', badClients?.slice(0, 5));

    if (!badClients || badClients.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tidak ada data yang perlu diperbaiki.',
        fixed: 0 
      });
    }

    const idsToFix = badClients.map((c: any) => c.id);

    const { error: updateError } = await supabase
      .from('clients')
      .update({ test_purpose: targetPurpose })
      .in('id', idsToFix);

    if (updateError) throw updateError;

    console.log(`[fix-purpose] ✅ Berhasil update ${idsToFix.length} klien → test_purpose='${targetPurpose}'`);

    return NextResponse.json({
      success: true,
      message: `Berhasil memperbaiki ${idsToFix.length} klien → test_purpose='${targetPurpose}'`,
      fixed: idsToFix.length,
      clients: badClients.map((c: any) => ({ id: c.id, name: c.name, old_purpose: c.test_purpose }))
    });

  } catch (error: any) {
    console.error('[fix-purpose] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: preview saja tanpa ubah data
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: allPurposes } = await supabase
      .from('clients')
      .select('id, name, test_purpose');

    const grouped = (allPurposes || []).reduce((acc: any, c: any) => {
      const key = c.test_purpose ?? 'NULL';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const badClients = (allPurposes || []).filter(
      (c: any) => !['EMP', 'STU', 'CHILD'].includes(c.test_purpose)
    );

    return NextResponse.json({
      summary: grouped,
      totalClients: allPurposes?.length ?? 0,
      clientsNeedingFix: badClients.length,
      preview: badClients.slice(0, 10).map((c: any) => ({ 
        id: c.id, 
        name: c.name, 
        current_purpose: c.test_purpose 
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
