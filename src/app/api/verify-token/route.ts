import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { token } = payload;

    if (!token) {
      return NextResponse.json({ error: "Token tidak boleh kosong" }, { status: 400 });
    }

    // 1. Cari token di database beserta data relasinya (test & client)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("tokens")
      .select(`
        *,
        client:clients(*)
      `)
      .eq("token_code", token.toUpperCase())
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Kode token tidak valid atau tidak ditemukan." }, { status: 404 });
    }

    if (tokenData.status === 'COMPLETED') {
      return NextResponse.json({ error: "Token ini sudah selesai digunakan." }, { status: 403 });
    }

    // Ambil data test_code berdasarkan prefix token
    let testCode = "CPM"; 
    const tCode = token.toUpperCase();
    if (tCode.startsWith("CHI-")) {
      testCode = "CPM";
    } else if (tCode.startsWith("STU-")) {
      testCode = "RAVEN2"; // Remaja mulai dengan RAVEN2
    } else if (tCode.startsWith("EMP-")) {
      testCode = "RAVEN2"; // Dewasa mulai dengan Tes Kognitif
    }

    if (tokenData.client_id && tokenData.client) {
      // Skema Tertutup (Closed Token) - Data anak sudah diimport dari Excel
      return NextResponse.json({
        success: true,
        type: "CLOSED",
        token_id: tokenData.id,
        test_code: testCode,
        client: tokenData.client,
        status: tokenData.status
      });
    } else {
      // Skema Terbuka (Open Token) - Butuh isi biodata
      return NextResponse.json({
        success: true,
        type: "OPEN",
        token_id: tokenData.id,
        test_code: testCode,
        status: tokenData.status
      });
    }
    
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem: " + err.message },
      { status: 500 }
    );
  }
}
