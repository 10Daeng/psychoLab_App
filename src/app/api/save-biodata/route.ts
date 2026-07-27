import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { saveBiodataSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = saveBiodataSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 });
    }
    const payload = parseResult.data;
    const { token_id, client_id, name, birth_date, gender, school_or_institution, grade, parent_name, parent_phone, address, registration_number, test_registration_number, target_institution, test_purpose, birth_place, birth_order, special_needs, parent_job, parent_education } = payload;

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


    let finalClient: any;

    if (client_id) {
      // Update Klien Lama (Revisi/Edit)
      const { data, error } = await supabase
        .from("clients")
        .update({
          name, birth_date, gender, school_or_institution, grade, parent_name, parent_phone, address, registration_number, test_registration_number, target_institution, test_purpose, birth_place, birth_order, special_needs, parent_job, parent_education
        })
        .eq("id", client_id)
        .select("*")
        .single();
      if (error) throw error;
      finalClient = data;
    } else {
      // Buat Klien Baru
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name, birth_date, gender, school_or_institution, grade, parent_name, parent_phone, address, registration_number, test_registration_number, target_institution, test_purpose, birth_place, birth_order, special_needs, parent_job, parent_education
        })
        .select("*")
        .single();
      if (error) throw error;
      finalClient = data;

      // Tautkan Token ke Klien Baru ini
      await supabase
        .from("tokens")
        .update({ client_id: finalClient.id })
        .eq("id", token_id);
    }

    return NextResponse.json({ success: true, client: finalClient });
    
  } catch (err: any) {
    console.error("save-biodata error:", err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan internal saat menyimpan biodata" }, { status: 500 });
  }
}
