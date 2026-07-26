import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // 1. Dapatkan Total Klien
    const { count: clientsCount } = await supabaseAdmin
      .from("clients")
      .select("*", { count: "exact", head: true });

    // 2. Dapatkan Semua Token untuk dianalisa (Bypass RLS dengan supabaseAdmin)
    const { data: allTokens, error: tokensError } = await supabaseAdmin
      .from("tokens")
      .select(`
        id, token_code, is_used, status, purpose, created_at,
        clients (name)
      `)
      .order("created_at", { ascending: false });

    if (tokensError) throw tokensError;

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
