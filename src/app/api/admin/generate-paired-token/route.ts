import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const generateTokenString = (prefix: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
};

export async function POST(request: Request) {
  try {
    const {
      name, birth_date, gender, school_or_institution, grade,
      parent_name, parent_phone, address, registration_number,
      purpose, // 'CHILD' | 'STU' | 'EMP'
      generate_parent_token, // boolean
    } = await request.json();

    if (!name || !birth_date || !purpose) {
      return NextResponse.json(
        { success: false, error: 'Nama, tanggal lahir, dan paket wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Ambil alat tes dari DB
    const { data: dbTests, error: testsError } = await supabaseAdmin
      .from('tests').select('id, code');
    if (testsError || !dbTests) throw new Error('Gagal mengambil data alat tes.');

    const getTestIds = (codes: string[]) =>
      codes.map(c => dbTests.find(t => t.code === c)?.id).filter(Boolean) as string[];

    let testCodes: string[] = [];
    let tokenPrefix = '';
    let purposeLabel = '';

    if (purpose === 'CHILD') {
      testCodes = ['CPM'];
      tokenPrefix = 'CHI';
      purposeLabel = 'KEMATANGAN';
    } else if (purpose === 'STU') {
      testCodes = ['RAVEN2', 'SDS', 'VAK'];
      tokenPrefix = 'STU';
      purposeLabel = 'PENJURUSAN';
    } else if (purpose === 'EMP') {
      testCodes = ['RAVEN2', 'HEXACO', 'DISC', 'WVI'];
      tokenPrefix = 'EMP';
      purposeLabel = 'REKRUTMEN';
    } else {
      return NextResponse.json({ success: false, error: 'Paket tidak valid.' }, { status: 400 });
    }

    const testIds = getTestIds(testCodes);
    if (testIds.length !== testCodes.length) {
      throw new Error(`Alat tes untuk paket ${purpose} tidak lengkap di database.`);
    }

    // 2. Buat klien baru
    const { data: newClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        name,
        birth_date,
        gender: gender || null,
        school_or_institution: school_or_institution || null,
        grade: grade || null,
        parent_name: parent_name || null,
        parent_phone: parent_phone || null,
        address: address || null,
        registration_number: registration_number || null,
        test_purpose: purpose,
      })
      .select()
      .single();

    if (clientError || !newClient) throw new Error('Gagal membuat data klien: ' + clientError?.message);

    // 3. Buat token utama
    const mainTokenCode = generateTokenString(tokenPrefix);
    const { data: mainToken, error: mainTokenError } = await supabaseAdmin
      .from('tokens')
      .insert({
        token_code: mainTokenCode,
        client_id: newClient.id,
        test_ids: testIds,
        respondent_type: 'SELF',
        purpose: purposeLabel,
        status: 'PENDING',
      })
      .select()
      .single();

    if (mainTokenError || !mainToken) throw new Error('Gagal membuat token utama: ' + mainTokenError?.message);

    // 4. Opsional: Buat token orang tua (hanya untuk CHILD)
    let parentTokenCode: string | null = null;
    if (purpose === 'CHILD' && generate_parent_token) {
      const parentTestIds = getTestIds(['PARENT_Q']);
      if (parentTestIds.length > 0) {
        parentTokenCode = generateTokenString('PRT');
        await supabaseAdmin.from('tokens').insert({
          token_code: parentTokenCode,
          client_id: newClient.id,
          test_ids: parentTestIds,
          respondent_type: 'PARENT',
          purpose: 'KESIAPAN_SD',
          parent_token_id: mainToken.id,
          status: 'PENDING',
        });
      }
    }

    return NextResponse.json({
      success: true,
      client_id: newClient.id,
      child_token: mainTokenCode,
      parent_token: parentTokenCode,
      message: `Token berhasil dibuat untuk ${name}.`,
    });

  } catch (err: any) {
    console.error('generate-paired-token error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
