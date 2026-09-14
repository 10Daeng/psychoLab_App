import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tokenId, force } = await req.json();

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    // --- VALIDASI: Cek apakah semua tes sudah memiliki end_time ---
    // Kecuali jika Admin secara eksplisit memaksa (force=true) dengan sadar
    if (!force) {
      const { data: testResults } = await supabase
        .from('test_results')
        .select('id, end_time, raw_data')
        .eq('token_id', tokenId);

      if (testResults && testResults.length > 0) {
        const incompleteTests = testResults.filter(
          (tr: any) => !tr.end_time || !tr.raw_data || tr.raw_data === '[]' || (Array.isArray(tr.raw_data) && tr.raw_data.length === 0)
        );

        if (incompleteTests.length > 0) {
          return NextResponse.json({
            error: `Peringatan: ${incompleteTests.length} dari ${testResults.length} sesi tes belum memiliki data jawaban. Kandidat mungkin belum mengerjakan atau belum mengumpulkan (Submit) tesnya. Akibatnya, skor dan laporan AI tidak akan dapat digenerate. Apakah Anda tetap ingin menyelesaikan token ini?`,
            requiresForce: true,
            incompleteCount: incompleteTests.length,
            totalCount: testResults.length
          }, { status: 409 });
        }
      }
    }

    const { error } = await supabase
      .from('tokens')
      .update({ status: 'COMPLETED' })
      .eq('id', tokenId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Status token berhasil diubah menjadi Selesai.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
