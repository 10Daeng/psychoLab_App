import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { loginSchema } from '@/lib/validations';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Basic in-memory rate limiter for login
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const limitRecord = rateLimitMap.get(ip);
    
    if (limitRecord && now < limitRecord.resetTime) {
      if (limitRecord.count >= 5) {
        return NextResponse.json({ success: false, error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 });
      }
      limitRecord.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 menit
    }

    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { username, password } = parseResult.data;

    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in environment variables");
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Nama pengguna atau kata sandi salah' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (isValid) {
      // Create JWT
      const secret = new TextEncoder().encode(jwtSecret);
      const token = await new SignJWT({ 
        role: user.role, 
        organization_id: user.organization_id 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      return response;
    } else {
      return NextResponse.json({ success: false, error: 'Kata sandi salah' }, { status: 401 });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
