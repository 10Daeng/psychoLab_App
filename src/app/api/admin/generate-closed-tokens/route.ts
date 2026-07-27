import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const generateTokenString = (prefix: string) => {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const randomStr = Array.from(array, byte => byte.toString(36).padStart(2, '0')).join('').substring(0, 6).toUpperCase();
  return `${prefix}-${randomStr}`;
};

export async function POST(request: Request) {
  try {
    const { clientIds, purpose } = await request.json();
    
    if (!clientIds || clientIds.length === 0 || !purpose) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    // Ambil test IDs
    const { data: dbTests } = await supabaseAdmin.from('tests').select('id, code');
    if (!dbTests) throw new Error("Gagal mengambil data alat tes");

    const getTestIds = (codes: string[]) => {
      return codes.map(c => dbTests.find(t => t.code === c)?.id).filter(Boolean);
    };

    let testCodes: string[] = [];
    if (purpose === 'CHILD') testCodes = ['CPM'];
    else if (purpose === 'STU') testCodes = ['RAVEN2', 'SDS', 'VAK'];
    else if (purpose === 'EMP') testCodes = ['RAVEN2', 'HEXACO', 'DISC', 'WVI'];

    const testIds = getTestIds(testCodes);
    if (testIds.length !== testCodes.length) {
      throw new Error(`Beberapa alat tes untuk paket ${purpose} tidak ditemukan di database.`);
    }

    const parentTestIds = getTestIds(['PARENT_Q']);

    let generatedCount = 0;

    for (const clientId of clientIds) {
      const newTokenCode = generateTokenString(purpose === 'CHILD' ? 'CHI' : purpose);
      
      // Insert main token
      const { data: mainToken, error: mainError } = await supabaseAdmin
        .from('tokens')
        .insert({
          token_code: newTokenCode,
          test_ids: testIds,
          client_id: clientId,
          respondent_type: 'SELF',
          purpose: purpose === 'CHILD' ? 'KEMATANGAN' : purpose === 'STU' ? 'PENJURUSAN' : 'REKRUTMEN',
          status: 'PENDING'
        })
        .select()
        .single();
        
      if (mainError) throw mainError;
      generatedCount++;

      // If CHILD, also generate PARENT token
      if (purpose === 'CHILD' && parentTestIds.length > 0) {
        const parentTokenCode = generateTokenString('PRT');
        const { error: parentError } = await supabaseAdmin
          .from('tokens')
          .insert({
            token_code: parentTokenCode,
            test_ids: parentTestIds,
            client_id: clientId,
            parent_token_id: mainToken.id,
            respondent_type: 'PARENT',
            purpose: 'KEMATANGAN',
            status: 'PENDING'
          });
        if (parentError) throw parentError;
        generatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil men-generate ${generatedCount} token untuk ${clientIds.length} klien.` 
    });
    
  } catch (error: any) {
    console.error('generate-closed-tokens error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal saat men-generate token.' }, { status: 500 });
  }
}
