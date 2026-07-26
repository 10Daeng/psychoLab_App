import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { token_id, client_id, name, birth_date, gender, school_or_institution, grade, parent_name, parent_phone, address, registration_number, test_registration_number, target_institution, test_purpose, birth_place, birth_order, special_needs, parent_job, parent_education } = payload;

    if (!token_id || !name || !birth_date) {
      return NextResponse.json({ error: "Data wajib (Nama, Tanggal Lahir) tidak lengkap" }, { status: 400 });
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
