import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { token_id, client_id, test_code } = await request.json();

    if (!token_id || !client_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Cari test_id dari test_code
    const { data: testData } = await supabase
      .from("tests")
      .select("id")
      .eq("code", test_code || 'CPM')
      .single();

    if (!testData) {
      return NextResponse.json({ error: "Test Code tidak valid" }, { status: 400 });
    }

    // Buat sesi Test Results
    const { data: testResult, error: resultError } = await supabase
      .from("test_results")
      .insert({
        client_id: client_id,
        test_id: testData.id,
        token_id: token_id,
        start_time: new Date().toISOString(),
        raw_data: []
      })
      .select("id")
      .single();

    if (resultError) throw resultError;

    // Update token status
    await supabase
      .from("tokens")
      .update({ is_used: true, client_id: client_id, status: 'IN_PROGRESS' })
      .eq("id", token_id);

    return NextResponse.json({ success: true, test_result_id: testResult.id });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
