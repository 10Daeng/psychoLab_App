import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { token_id, client_id, test_code } = await request.json();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) return NextResponse.json({ error: "Sesi tidak valid. Silakan login kembali dengan token Anda." }, { status: 401 });
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const { payload: jwtPayload } = await jwtVerify(sessionCookie.value, secret);
      if (jwtPayload.token_id !== token_id) {
        return NextResponse.json({ error: "Akses ditolak. Token ID tidak sesuai dengan sesi Anda." }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    if (!token_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // AMBIL token data dari database untuk mendapatkan client_id yang sah
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("client_id")
      .eq("id", token_id)
      .single();
      
    if (tokenError || !tokenData || !tokenData.client_id) {
      return NextResponse.json({ error: "Token tidak valid atau belum terhubung dengan peserta." }, { status: 404 });
    }
    
    const validClientId = tokenData.client_id;

    // Cari test_id dari test_code
    const { data: testData } = await supabase
      .from("tests")
      .select("id")
      .eq("code", test_code || 'CPM')
      .single();

    if (!testData) {
      return NextResponse.json({ error: "Test Code tidak valid" }, { status: 400 });
    }

    // Cek Idempotency: Mencegah duplikasi data jika tombol ditekan berkali-kali
    const { data: existingResult } = await supabase
      .from("test_results")
      .select("id, end_time")
      .eq("token_id", token_id)
      .eq("test_id", testData.id)
      .maybeSingle();

    let testResultId = null;

    if (existingResult) {
      if (existingResult.end_time) {
        return NextResponse.json({ error: "Tes ini sudah diselesaikan." }, { status: 400 });
      }
      testResultId = existingResult.id;
    } else {
      // Buat sesi Test Results
      const { data: newTestResult, error: resultError } = await supabase
        .from("test_results")
        .insert({
          client_id: validClientId,
          test_id: testData.id,
          token_id: token_id,
          start_time: new Date().toISOString(),
          raw_data: []
        })
        .select("id")
        .single();

      if (resultError) throw resultError;
      testResultId = newTestResult.id;
    }

    // Update token status
    await supabase
      .from("tokens")
      .update({ is_used: true, status: 'IN_PROGRESS' })
      .eq("id", token_id);

    return NextResponse.json({ success: true, test_result_id: testResultId });
    
  } catch (err: any) {
    console.error("start-test error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal saat memulai tes" }, { status: 500 });
  }
}
