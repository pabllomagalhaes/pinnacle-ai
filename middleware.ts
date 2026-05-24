import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Inicializa a resposta padrão do Next.js
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Cria um cliente Supabase exclusivo para o middleware ler os cookies de sessão
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: "", ...options });
          supabaseResponse.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Solicita a validação do usuário
  const { data: { user } } = await supabase.auth.getUser();

  const isAccessingDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAccessingPublicRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login';

  // REGRA 1: Expulsar quem não está logado
  if (!user && isAccessingDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // REGRA 2: Puxar quem já está logado direto para a Dashboard
  if (user && isAccessingPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Configuração de onde o middleware deve atuar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};