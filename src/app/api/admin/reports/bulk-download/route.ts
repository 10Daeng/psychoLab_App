import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { decryptClientData } from '@/lib/encryption';

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

    // Map UI label ke nilai purpose yang tersimpan di DB
    const purposeMap: Record<string, string> = {
      CHILD: 'KEMATANGAN',
      STU:   'PENJURUSAN',
      EMP:   'REKRUTMEN',
    };
    const purposeDb = purposeMap[purpose] ?? purpose;

    // --- 2. Build Query dari tabel test_results ---
    let query = supabase
      .from("test_results")
      .select(`
        *,
        tests (code, name),
        tokens!inner (
          id, token_code, purpose, status, respondent_type,
          clients (name, school_or_institution, occupation, age)
        )
      `)
      .eq("tokens.purpose", purposeDb)
      .eq("tokens.status", "COMPLETED")
      .eq("tokens.respondent_type", "SELF");

    // Execute query
    const { data: testResults, error } = await query;
    if (error) throw new Error(error.message);

    // --- 3. Filter & Decrypt Data ---
    let filteredResults = testResults || [];
    
    // Pertama, dekripsi data klien agar filter dan output berjalan dengan benar
    filteredResults = filteredResults.map((tr: any) => {
      if (tr.tokens && tr.tokens.clients) {
        tr.tokens.clients = decryptClientData(tr.tokens.clients);
      }
      return tr;
    });

    if (institution && institution !== "ALL") {
      filteredResults = filteredResults.filter(
        (tr: any) => tr.tokens?.clients?.school_or_institution === institution
      );
    }

    // --- 4. Format Output & Pengelompokan ---
    const timestamp = new Date().toISOString().split("T")[0];
    
    // Objek hasil akhir
    const groupedData: Record<string, any[]> = {};

    filteredResults.forEach((tr: any) => {
      const testCode = tr.tests?.code || "UNKNOWN";
      
      if (!groupedData[testCode]) {
        groupedData[testCode] = [];
      }

      groupedData[testCode].push({
        kandidat_name: tr.tokens?.clients?.name,
        institusi: tr.tokens?.clients?.school_or_institution,
        posisi: tr.tokens?.clients?.occupation,
        usia: tr.tokens?.clients?.age,
        
        // Data dari test_results
        idx: tr.idx,
        id: tr.id,
        client_id: tr.client_id,
        test_id: tr.test_id,
        token_id: tr.token_id,
        start_time: tr.start_time,
        end_time: tr.end_time,
        raw_data: tr.raw_data,
        calculated_score: tr.calculated_score,
        observation_data: tr.observation_data,
        created_at: tr.created_at
      });
    });

    const exportData = {
      metadata: {
        kategori_laporan: purposeDb,
        filter_institusi: institution || "SEMUA (ALL)",
        tanggal_unduh: timestamp,
        total_kandidat_terunduh: new Set(filteredResults.map((tr: any) => tr.client_id)).size
      },
      data_tes: groupedData
    };

    // --- 5. Return JSON sebagai Attachment ---
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
