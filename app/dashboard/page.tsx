import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Trash2, CheckCircle2, Circle, Clock } from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. BUSCA DE DADOS (Tasks e Sessions)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  // CÁLCULOS DAS MÉTRICAS
  const totalMinutes = sessions?.reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedTasksCount = tasks?.filter(task => task.is_completed).length || 0;

  // --- SERVER ACTIONS ---

  async function handleSignOut() {
    "use server";
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    });
    await supabase.auth.signOut();
    redirect("/login");
  }

  async function handleAddTask(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title) return;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value; }, set() {}, remove() {} }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("tasks").insert({ title, user_id: user.id });
      revalidatePath("/dashboard");
    }
  }

  async function handleToggleTask(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const is_completed = formData.get("is_completed") === "true";

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value; }, set() {}, remove() {} }
    });

    await supabase.from("tasks").update({ is_completed: !is_completed }).eq("id", id);
    revalidatePath("/dashboard");
  }

  async function handleDeleteTask(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value; }, set() {}, remove() {} }
    });

    await supabase.from("tasks").delete().eq("id", id);
    revalidatePath("/dashboard");
  }

  // NOVA AÇÃO: Grava a sessão de foco no banco de dados
  async function handleAddFocusSession(formData: FormData) {
    "use server";
    const duration = parseInt(formData.get("duration") as string, 10);
    if (isNaN(duration) || duration <= 0) return;

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value; }, set() {}, remove() {} }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("focus_sessions").insert({
        duration_minutes: duration,
        user_id: user.id
      });
      revalidatePath("/dashboard");
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Performance</h1>
          <p className="text-muted-foreground mt-2">Bem-vindo, {user.email}.</p>
        </div>
        <form action={handleSignOut}>
          <Button variant="outline">Sair</Button>
        </form>
      </div>

      {/* Grid de Métricas Dinâmicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Horas de Foco</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{totalHours}h</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Metas Cumpridas</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{completedTasksCount}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{tasks?.length || 0}</div></CardContent></Card>
      </div>

      {/* Bloco de Ações Interativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        
        {/* Coluna da Esquerda: Formulários de Entrada (Tarefas e Foco) */}
        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Nova Meta / Tarefa</CardTitle></CardHeader>
            <CardContent>
              <form action={handleAddTask} className="space-y-4">
                <input type="text" name="title" placeholder="Ex: Refatorar estrutura do banco de dados" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                <Button type="submit" className="w-full">Adicionar Meta</Button>
              </form>
            </CardContent>
          </Card>

          {/* NOVO FORMULÁRIO: Lançador de Sessões de Foco */}
          <Card>
            <CardHeader><CardTitle>Registo de Sessão de Foco</CardTitle></CardHeader>
            <CardContent>
              <form action={handleAddFocusSession} className="grid grid-cols-3 gap-3">
                <Button type="submit" name="duration" value="25" variant="secondary" className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" /> 25 min
                </Button>
                <Button type="submit" name="duration" value="50" variant="secondary" className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" /> 50 min
                </Button>
                <Button type="submit" name="duration" value="90" variant="secondary" className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" /> 90 min
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Selecione um bloco para simular o encerramento de um ciclo Pomodoro.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita: Listagem das Metas Atuais */}
        <Card>
          <CardHeader><CardTitle>Minhas Metas Atuais</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <li key={task.id} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm transition-all ${task.is_completed ? "bg-muted/50" : "bg-card"}`}>
                    <div className="flex items-center space-x-3">
                      <form action={handleToggleTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="is_completed" value={task.is_completed.toString()} />
                        <button type="submit" className="mt-1 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                          {task.is_completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                        </button>
                      </form>
                      <span className={`text-sm ${task.is_completed ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                    </div>
                    <form action={handleDeleteTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma meta cadastrada ainda.</p>
              )}
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}