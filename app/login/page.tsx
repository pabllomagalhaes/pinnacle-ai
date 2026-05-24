"use client";

import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        // NOVA CONFIGURAÇÃO: Força o Google a enviar o token em todos os logins
        queryParams: {
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    });
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">PinnacleAI</h1>
        <p className="text-muted-foreground text-sm">Faça login para acessar suas métricas</p>
      </div>
      <Button onClick={handleGoogleLogin}>Entrar com o Google</Button>
    </div>
  );
}