import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { jwtVerify } from "jose";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("client_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sesi tidak valid. Akses ditolak." }, { status: 401 });
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      await jwtVerify(sessionCookie.value, secret);
    } catch (e) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    const data = await req.json();
    const { responses, progress } = data;

    if (responses && responses.length > 0) {
      const { error: err1 } = await supabase.from('parent_responses').insert(responses);
      if (err1) throw err1;
    }

    if (progress) {
      const { error: err2 } = await supabase.from('parent_progress').upsert(progress);
      if (err2) throw err2;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
