import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  // 1. AWAIT OBRIGATÓRIO: O Next.js agora exige que cookies() seja assíncrono
  const cookieStore = await cookies();
  
  // 2. Cria o cliente Supabase adequado para o Servidor (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // 3. Busca o usuário com segurança lendo os cookies
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Protege a rota: se não houver usuário, expulsa pro login
  if (!user) {
    redirect("/login");
  }

  // 5. Ação de logout (Server Action)
  async function handleSignOut() {
    "use server";
    
    // AWAIT AQUI TAMBÉM: Dentro da Server Action, também precisamos aguardar
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
    
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Performance</h1>
          <p className="text-muted-foreground mt-2">Bem-vindo, {user.email}.</p>
        </div>
        <form action={handleSignOut}>
          <Button variant="outline">Sair</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Horas de Foco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0h</div>
            <p className="text-xs text-muted-foreground mt-1">Sessões totais hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Metas Cumpridas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Tarefas finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Comparado a ontem</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}