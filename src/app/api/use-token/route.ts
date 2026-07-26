import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { token_id } = await request.json();

    if (!token_id) {
      return NextResponse.json({ success: false, error: "Token ID required" }, { status: 400 });
    }

    // Mengunci token (is_used = true, status = IN_PROGRESS)
    // Jika kolom used_at sudah dibuat oleh admin di tabel, ini akan terisi. Jika belum, kita hanya set is_used.
    const { data, error } = await supabaseAdmin
      .from("tokens")
      .update({
        is_used: true,
        status: 'IN_PROGRESS'
      })
      .eq("id", token_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
