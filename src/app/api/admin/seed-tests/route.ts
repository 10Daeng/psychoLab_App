import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const REQUIRED_TESTS = [
  { code: 'CPM', name: 'Coloured Progressive Matrices', category: 'KOGNITIF' },
  { code: 'PARENT_Q', name: 'Kuesioner Observasi Orang Tua', category: 'OBSERVASI' },
  { code: 'RAVEN2', name: 'Raven SPM', category: 'KOGNITIF' },
  { code: 'SDS', name: 'Self-Directed Search (RIASEC)', category: 'MINAT' },
  { code: 'VAK', name: 'Gaya Belajar (VAK)', category: 'GAYA_BELAJAR' },
  { code: 'HEXACO', name: 'HEXACO Personality', category: 'KEPRIBADIAN' },
  { code: 'DISC', name: 'DISC Profile', category: 'GAYA_KERJA' },
  { code: 'WVI', name: 'Work Value Inventory', category: 'NILAI_KERJA' },
  { code: 'DAT', name: 'Differential Aptitude Test', category: 'BAKAT' },
  { code: 'GRAPHOLOGY', name: 'Analisis Grafologi', category: 'PROYEKTIF' },
  { code: 'WARTEGG', name: 'Wartegg Zeichen Test', category: 'PROYEKTIF' },
];

export async function GET() {
  try {
    const { data: existingTests, error: fetchError } = await supabaseAdmin.from('tests').select('*');
    
    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    const missingTests = REQUIRED_TESTS.filter(
      rt => !existingTests?.find(et => et.code === rt.code)
    );

    if (missingTests.length > 0) {
      const { data, error: insertError } = await supabaseAdmin
        .from('tests')
        .insert(missingTests)
        .select();

      if (insertError) {
         return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
      const { data: allTests } = await supabaseAdmin.from('tests').select('*');
      return NextResponse.json({ success: true, message: `Berhasil menambahkan ${missingTests.length} alat tes.`, data: allTests });
    }

    return NextResponse.json({ success: true, message: 'Semua alat tes sudah lengkap.', data: existingTests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
