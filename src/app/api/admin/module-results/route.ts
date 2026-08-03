import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module');

    if (!module) {
      return NextResponse.json({ error: 'Module code is required' }, { status: 400 });
    }

    // Special Case: OBSERVASI_ANAK
    if (module === 'OBSERVASI_ANAK') {
      const { data, error } = await supabase
        .from('tokens')
        .select(`
          id, token_code, purpose, created_at, clients(*),
          observations!inner(*)
        `)
        .not('observations.observation_data', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // Special Case: WAWANCARA_ANAK
    if (module === 'WAWANCARA_ANAK') {
      const { data, error } = await supabase
        .from('tokens')
        .select(`
          id, token_code, purpose, created_at, clients(*),
          observations!inner(*)
        `)
        .not('observations.interview_data', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // Standard test codes (including KUESIONER_ORTU -> PARENT_Q)
    const testCode = module === 'KUESIONER_ORTU' ? 'PARENT_Q' : module;

    // Step 1: Find the test ID for the given module code
    const { data: testData, error: testErr } = await supabase
      .from('tests')
      .select('id')
      .eq('code', testCode)
      .single();

    if (testErr || !testData) {
      return NextResponse.json({ error: 'Test module not found' }, { status: 404 });
    }

    // Step 2: Fetch all test results for this test ID, including the token and client
    const { data: results, error: resultsErr } = await supabase
      .from('test_results')
      .select(`
        *,
        tokens(
          id,
          token_code,
          purpose,
          created_at,
          clients(*)
        )
      `)
      .eq('test_id', testData.id)
      .order('completed_at', { ascending: false });

    if (resultsErr) throw resultsErr;

    return NextResponse.json({ data: results || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

