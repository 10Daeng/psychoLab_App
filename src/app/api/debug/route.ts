import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data: qData } = await supabaseAdmin.from('questionnaires').select('id').eq('code', 'DISC').single();
  const { data: questions } = await supabaseAdmin.from('questions').select('response_options, scoring_key').eq('questionnaire_id', qData.id).limit(1);
  return NextResponse.json({ questions });
}
