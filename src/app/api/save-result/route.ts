import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { saveResultSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = saveResultSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }
    const payload = parseResult.data;
    const { test_result_id, resultsLog } = payload;

    // 1. Ambil data current test_result beserta data client untuk mencegah manipulasi umur
    const { data: currentTestResult, error: fetchErr } = await supabase
      .from('test_results')
      .select('token_id, client_id, test_id, tests(code), client:clients(*)')
      .eq('id', test_result_id)
      .single();

    if (fetchErr || !currentTestResult) {
      throw new Error("Gagal mengambil data test result: " + (fetchErr?.message || "Data tidak ditemukan"));
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) return NextResponse.json({ error: "Sesi tidak valid. Silakan login kembali dengan token Anda." }, { status: 401 });
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const { payload: jwtPayload } = await jwtVerify(sessionCookie.value, secret);
      if (jwtPayload.token_id !== currentTestResult.token_id) {
        return NextResponse.json({ error: "Akses ditolak. Token ID tidak sesuai dengan sesi Anda." }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    const testsRef = currentTestResult.tests as any;
    const testCode = Array.isArray(testsRef) ? testsRef[0]?.code : testsRef?.code || "CPM";

    // 2. Gunakan EngineFactory untuk mengalkulasi skor secara dinamis
    const { EngineFactory } = await import("@/lib/engines/engine_factory");
    const engine = EngineFactory.getEngine(testCode);
    
    // Gunakan data client dari database untuk mencegah manipulasi umur (Data Tampering)
    const validClientData = currentTestResult.client;
    const assessmentResult = await engine.calculateScores(resultsLog, validClientData);

    // 3. Update Test Results yang sudah dibuat saat start (verify-token)
    const { error: resultError } = await supabase
      .from('test_results')
      .update({
        raw_data: resultsLog,
        calculated_score: assessmentResult,
        end_time: new Date().toISOString()
      })
      .eq('id', test_result_id);

    if (resultError) throw new Error("Gagal menyimpan hasil tes: " + resultError.message);

    let parentTokenCode = null;
    
    // 4. Generate Token Pendamping (Parent) HANYA JIKA TEST-NYA CPM
    if (testCode === 'CPM') {
      const { data: parentQTest } = await supabase
        .from('tests')
        .select('id')
        .eq('code', 'PARENT_Q')
        .single();
        
      const testIds = parentQTest ? [parentQTest.id] : [];

      const array = new Uint8Array(4);
      crypto.getRandomValues(array);
      const randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 6).toUpperCase();
      parentTokenCode = "PRT-" + randomHex;
      
      await supabase
        .from('tokens')
        .insert({
          token_code: parentTokenCode,
          client_id: currentTestResult.client_id,
          test_ids: testIds, 
          respondent_type: 'PARENT',
          purpose: 'KESIAPAN_SD',
          parent_token_id: currentTestResult.token_id,
          status: 'PENDING'
        });
    }

    return NextResponse.json({ 
      success: true, 
      result: assessmentResult,
      parent_token: parentTokenCode
    });
    
  } catch (err: any) {
    console.error("save-result error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal saat menyimpan hasil" }, { status: 500 });
  }
}
