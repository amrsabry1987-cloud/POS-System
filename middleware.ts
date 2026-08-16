import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Skip auth checks if environment variables are missing during static generation
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() for secure server-side verification
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 1. Root route redirect: Unauthenticated -> /login, Authenticated -> /dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url));
  }

  // 2. Prevent authenticated users from accessing /login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Protect all other application routes
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/_next') || pathname.includes('.');
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};