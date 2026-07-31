import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { tokenId } = await request.json();
    if (!tokenId) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tokens')
      .update({ status: 'PENDING', is_used: false })
      .eq('id', tokenId);

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: "Token berhasil di-reset ke status PENDING!" });
  } catch (error: any) {
    console.error('reset-token error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
