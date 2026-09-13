import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const purpose = url.searchParams.get("purpose") || "CHILD";
    const institution = url.searchParams.get("institution"); // Optional filter

    // --- 1. Verifikasi Sesi Admin ---
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sesi admin tidak valid" }, { status: 401 });
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      await jwtVerify(sessionCookie.value, secret);
    } catch (e) {
      return NextResponse.json({ error: "Sesi admin telah kedaluwarsa" }, { status: 401 });
    }

    // --- 2. Build Query ---
    let query = supabase
      .from("tokens")
      .select(`
        id, token_code, purpose, status, created_at, respondent_type,
        clients (*),
        test_results (
          id, start_time, end_time, raw_data, calculated_score,
          tests (code, name)
        )
      `)
      .eq("purpose", purpose)
      .eq("status", "COMPLETED") // Hanya ambil yang sudah selesai
      .in('respondent_type', ['CHILD', 'STUDENT', 'EMPLOYEE']); // Jangan ambil token PARENT di sini, atau ambil jika perlu

    // Execute query
    const { data: tokens, error } = await query;
    if (error) throw new Error(error.message);

    // --- 3. Filter by Institution (karena clients ter-join, kita filter setelah fetch) ---
    let filteredTokens = tokens || [];
    if (institution && institution !== "ALL") {
      filteredTokens = filteredTokens.filter(
        (t: any) => t.clients?.school_or_institution === institution
      );
    }

    // --- 4. Format Output ---
    // Karena kita tidak menyimpan password dalam klien, data ini cukup aman
    const exportData = filteredTokens.map((t: any) => ({
      token_id: t.id,
      token_code: t.token_code,
      kandidat: t.clients?.name,
      institusi: t.clients?.school_or_institution,
      usia: t.clients?.age,
      posisi_pekerjaan: t.clients?.occupation,
      waktu_dibuat: t.created_at,
      hasil_tes: t.test_results?.map((tr: any) => ({
        test_code: tr.tests?.code,
        test_name: tr.tests?.name,
        raw_data: tr.raw_data,
        calculated_score: tr.calculated_score,
        mulai: tr.start_time,
        selesai: tr.end_time
      })) || []
    }));

    // --- 5. Return JSON sebagai Attachment ---
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Bulk_RawData_${purpose}_${institution || "ALL"}_${timestamp}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (err: any) {
    console.error("Bulk Download Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
