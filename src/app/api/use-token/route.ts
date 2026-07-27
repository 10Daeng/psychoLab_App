import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase-admin';
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";

const startTestSchema = z.object({
  token_id: z.string().uuid("ID Token tidak valid")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = startTestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors[0].message }, { status: 400 });
    }
    const { token_id } = parseResult.data;

    // Proteksi IDOR: Pastikan user memiliki sesi untuk token ini
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) return NextResponse.json({ success: false, error: "Sesi tidak valid." }, { status: 401 });
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const { payload: jwtPayload } = await jwtVerify(sessionCookie.value, secret);
      if (jwtPayload.token_id !== token_id) {
        return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ success: false, error: "Sesi tidak valid." }, { status: 401 });
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
      console.error('use-token db error:', error);
      return NextResponse.json({ success: false, error: "Gagal memulai tes." }, { status: 500 });
    }

    // Filter token data before returning to client (don't send notes or sensitive info)
    const safeData = {
      id: data.id,
      token_code: data.token_code,
      status: data.status,
      purpose: data.purpose
    };

    return NextResponse.json({ success: true, token: safeData });
  } catch (err: any) {
    console.error('use-token error:', err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan internal." }, { status: 500 });
  }
}
