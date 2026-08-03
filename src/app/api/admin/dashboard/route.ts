import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminSession(session.value);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // 1. Dapatkan Total Klien
    let clientQuery = supabaseAdmin
      .from("clients")
      .select("*", { count: "exact", head: true });

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      clientQuery = clientQuery.eq('organization_id', payload.organization_id);
    }

    const { count: clientsCount } = await clientQuery;

    // 2. Dapatkan Semua Token untuk dianalisa
    let tokenQuery = supabaseAdmin
      .from("tokens")
      .select(`
        id, token_code, is_used, status, purpose, created_at,
        clients (name)
      `)
      .order("created_at", { ascending: false });

    if (payload.role === 'Org_Admin' && payload.organization_id) {
      tokenQuery = tokenQuery.eq('organization_id', payload.organization_id);
    }

    const { data: allTokens, error: tokensError } = await tokenQuery;

    if (tokensError) {
      console.error('dashboard db error:', tokensError);
      throw new Error('Gagal mengambil data dashboard');
    }

    // 3. Olah data agregat
    let completedCount = 0;
    let activeCount = 0;
    let pendingCount = 0;
    
    const distribution: Record<string, number> = {
      'KEMATANGAN': 0,
      'PENJURUSAN': 0,
      'REKRUTMEN': 0,
      'LAINNYA': 0
    };

    allTokens?.forEach(token => {
      // Hitung Status
      if (token.status === 'COMPLETED') completedCount++;
      else if (token.status === 'IN_PROGRESS') activeCount++;
      else pendingCount++;

      // Hitung Distribusi berdasarkan Purpose
      const p = token.purpose;
      if (p === 'KEMATANGAN' || p === 'CHILD' || p === 'KESIAPAN_SD') distribution['KEMATANGAN']++;
      else if (p === 'PENJURUSAN') distribution['PENJURUSAN']++;
      else if (p === 'REKRUTMEN') distribution['REKRUTMEN']++;
      else distribution['LAINNYA']++;
    });

    const chartData = [
      { name: 'Kematangan SD', value: distribution['KEMATANGAN'] },
      { name: 'Penjurusan', value: distribution['PENJURUSAN'] },
      { name: 'Rekrutmen', value: distribution['REKRUTMEN'] },
    ].filter(item => item.value > 0);
    
    // Jika masih kosong (belum ada token), berikan data dummy agar grafik tidak error (opsional)
    if (chartData.length === 0) {
      chartData.push({ name: 'Belum Ada Data', value: 1 }); // Hanya visual placeholder
    }

    // 4. Ambil 5 aktivitas terbaru (5 token teratas karena sudah di-order)
    const recentActivity = allTokens?.slice(0, 5).map(token => ({
      id: token.id,
      name: token.clients ? (token.clients as any).name : 'Belum Diketahui (Token Terbuka)',
      code: token.token_code,
      purpose: token.purpose,
      status: token.status,
      created_at: token.created_at
    })) || [];

    return NextResponse.json({ 
      success: true, 
      stats: {
        clients: clientsCount || 0,
        completed: completedCount,
        active: activeCount,
        pending: pendingCount
      },
      chartData,
      recentActivity
    });
  } catch (error: any) {
    console.error('dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
