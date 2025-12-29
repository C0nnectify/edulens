import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/how-it-works' ||
    pathname === '/scholarships' ||
    pathname === '/marketplace'
  ) {
    return NextResponse.next();
  }

  // Check for protected dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/new-dashboard') || pathname.startsWith('/profile')) {
    // Check for better-auth session cookie (edge-runtime compatible)
    const sessionCookie = request.cookies.get('better-auth.session_token');

    if (!sessionCookie) {
      // No session cookie, redirect to signin
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Session cookie exists, allow access (actual validation happens in pages)
    return NextResponse.next();
  }

  // Check for admin routes
  if (pathname.startsWith('/admin')) {
    // Check for better-auth session cookie
    const sessionCookie = request.cookies.get('better-auth.session_token');

    if (!sessionCookie) {
      // No session cookie, redirect to signin
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Session exists, role validation happens in the admin pages
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};