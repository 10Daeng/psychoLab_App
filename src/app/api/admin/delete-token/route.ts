import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: "ID token tidak diberikan" }, { status: 400 });
    }

    // Validasi format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ success: false, error: "Format ID tidak valid" }, { status: 400 });
    }

    // Hapus juga token parent (PRT) yang terhubung dengan token ini
    await supabaseAdmin
      .from('tokens')
      .delete()
      .eq('parent_token_id', id);

    const { error } = await supabaseAdmin
      .from('tokens')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('delete-token db error:', error);
      return NextResponse.json({ success: false, error: 'Gagal menghapus token di database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Token berhasil dihapus" });
  } catch (error: any) {
    console.error('delete-token error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
