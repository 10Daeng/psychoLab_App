import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;

    const { data, error } = await supabaseAdmin
      .from('observations')
      .select('notes, observation_data, interview_data')
      .eq('token_id', tokenId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found, which is fine
      throw error;
    }

    if (!data) {
      return NextResponse.json({ success: true, notes: '', observation_data: {}, interview_data: {} });
    }

    return NextResponse.json({ 
      success: true, 
      notes: data.notes || '',
      observation: data.observation_data || {},
      interview: data.interview_data || {}
    });
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
    // Client sends the old format: stringified JSON { notes, observation, interview } or just a string
    let bodyData = await request.json();
    let notes = '';
    let obs = {};
    let inv = {};

    if (bodyData.notes && typeof bodyData.notes === 'string') {
       // Support the existing client logic that sends: JSON.stringify({ notes, observation: obs, interview: inv })
       try {
         const parsed = JSON.parse(bodyData.notes);
         notes = parsed.notes || '';
         obs = parsed.observation || {};
         inv = parsed.interview || {};
       } catch (e) {
         notes = bodyData.notes;
       }
    }

    const { error } = await supabaseAdmin
      .from('observations')
      .upsert({ 
        token_id: tokenId,
        notes: notes,
        observation_data: obs,
        interview_data: inv,
        updated_at: new Date().toISOString()
      }, { onConflict: 'token_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Catatan berhasil disimpan.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
