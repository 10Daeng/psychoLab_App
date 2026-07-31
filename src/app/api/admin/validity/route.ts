import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose');

    // 1. Ambil token yang sudah COMPLETED
    let query = supabaseAdmin
      .from('tokens')
      .select(`
        id,
        token_code,
        status,
        created_at,
        respondent_type,
        clients (*),
        test_results (
          test_id,
          raw_data,
          calculated_score,
          tests (code)
        )
      `)
      .eq('status', 'COMPLETED')
      .neq('respondent_type', 'PARENT');

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) throw tokensError;

    // 2. Ambil Parent tokens untuk status (khusus paket CHI)
    const parentIds = tokens?.map(t => t.id) || [];
    let parentTokens: any[] = [];
    
    if (parentIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('tokens')
        .select('parent_token_id, status')
        .in('parent_token_id', parentIds);
      parentTokens = data || [];
    }

    // 3. Gabungkan data
    const formattedData = tokens?.map(t => {
      const client = t.clients as any;
      const results = t.test_results as any[];
      const pToken = parentTokens.find(p => p.parent_token_id === t.id);
      
      let testCodes: string[] = [];
      let rawDataMaster: any = {
        answers: {},
        userData: {}
      };
      let sdsValidity = null;

      results?.forEach(r => {
        const code = Array.isArray(r.tests) ? (r.tests as any)[0]?.code : (r.tests as any)?.code;
        if (code) {
          testCodes.push(code);
          // Extract answers
          if (r.raw_data && r.raw_data.answers) {
            // Merge answers
            rawDataMaster.answers = { ...rawDataMaster.answers, ...r.raw_data.answers };
          }
          if (r.raw_data && r.raw_data.userData) {
            rawDataMaster.userData = { ...rawDataMaster.userData, ...r.raw_data.userData };
          }
          
          // Khusus SDS, validitas sudah dihitung di backend
          if (code === 'SDS' && r.calculated_score?.validity) {
            sdsValidity = r.calculated_score.validity;
          }
        }
      });

      return {
        id: t.id,
        tokenCode: t.token_code,
        status: t.status,
        submittedAt: t.created_at,
        userData: {
          nama: client?.name || 'Anonim',
          email: client?.registration_number || '-',
          instansi: client?.school_or_institution || '-',
          jabatan: client?.grade || '-'
        },
        parentStatus: pToken ? pToken.status : "NOT_APPLICABLE",
        testCodes,
        rawData: rawDataMaster,
        sdsValidity
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('validity error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
