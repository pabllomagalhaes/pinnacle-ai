"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function handleSignOut() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
  
  // Limpa o token do Google e a sessão do banco de dados
  cookieStore.set({ name: 'google_provider_token', value: '', maxAge: 0 });
  await supabase.auth.signOut();
  
  // Redireciona o usuário para a porta de entrada
  redirect("/login");
}