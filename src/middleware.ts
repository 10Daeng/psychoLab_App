import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Protect /admin routes except /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session');
    let isValid = false;
    
    if (session && session.value) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
        await jwtVerify(session.value, secret);
        isValid = true;
      } catch (err) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /api/admin routes except /api/admin/login
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const session = request.cookies.get('admin_session');
    let isValid = false;
    
    if (session && session.value) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
        await jwtVerify(session.value, secret);
        isValid = true;
      } catch (err) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
