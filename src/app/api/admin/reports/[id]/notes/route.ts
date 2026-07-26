import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;

    const { data, error } = await supabaseAdmin
      .from('tokens')
      .select('psychologist_notes')
      .eq('id', tokenId)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, notes: data?.psychologist_notes || '' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    const { notes } = await request.json();

    if (typeof notes !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid notes data' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tokens')
      .update({ psychologist_notes: notes })
      .eq('id', tokenId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Catatan berhasil disimpan.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
