import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SignJWT } from "jose";
import { decrypt } from "@/lib/encryption";

// Rate limiter untuk mencegah brute-force token
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const now = Date.now();
    const limitRecord = rateLimitMap.get(ip);
    
    if (limitRecord && now < limitRecord.resetTime) {
      if (limitRecord.count >= 10) {
        return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.' }, { status: 429 });
      }
      limitRecord.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    }

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
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
      const jwt = await new SignJWT({ token_id: tokenData.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('12h')
        .sign(secret);

      // Filter data klien: hanya kirim field yang dibutuhkan frontend
      const clientData = tokenData.client as any;
      const safeClient = {
        id: clientData.id,
        name: decrypt(clientData.name),
        birth_date: clientData.birth_date,
        gender: clientData.gender,
        school_or_institution: clientData.school_or_institution,
        grade: clientData.grade,
      };

      const response = NextResponse.json({
        success: true,
        type: "CLOSED",
        token_id: tokenData.id,
        test_code: testCode,
        client: safeClient,
        status: tokenData.status
      });

      response.cookies.set('client_session', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12
      });

      return response;
    } else {
      // Skema Terbuka (Open Token) - Butuh isi biodata
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
      const jwt = await new SignJWT({ token_id: tokenData.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('12h')
        .sign(secret);

      const response = NextResponse.json({
        success: true,
        type: "OPEN",
        token_id: tokenData.id,
        test_code: testCode,
        status: tokenData.status
      });

      response.cookies.set('client_session', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12
      });

      return response;
    }
    
  } catch (err: any) {
    console.error("verify-token error:", err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}
