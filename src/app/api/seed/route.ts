import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function GET() {
  try {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
