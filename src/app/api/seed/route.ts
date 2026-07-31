import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Proteksi: Hanya admin yang bisa seed database
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
      await jwtVerify(session.value, secret);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
    }

    let { data } = await supabase.from('tests').select('*').eq('code', 'PARENT_Q').single();
    if (!data) {
      const { data: inserted, error } = await supabase.from('tests').insert({
        code: 'PARENT_Q',
        name: 'Kuesioner Orang Tua',
        description: 'Kuesioner Riwayat Tumbuh Kembang',
        estimated_time: 15,
        is_active: true
      }).select().single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Inserted PARENT_Q', data: inserted });
    }
    return NextResponse.json({ success: true, message: 'PARENT_Q already exists', data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
