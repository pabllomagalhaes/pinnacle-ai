import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Trash2, CheckCircle2, Circle, Clock, Calendar, Video, Target } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
// NOVA IMPORTAÇÃO
import { FocusChart } from "@/components/FocusChart";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const providerToken = cookieStore.get("google_provider_token")?.value;
  let calendarEvents = [];
  let calendarError = false;

  if (providerToken) {
    try {
      const now = new Date().toISOString();
      const googleResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=5&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${providerToken}` },
          next: { revalidate: 60 }
        }
      );

      if (googleResponse.ok) {
        const calendarData = await googleResponse.json();
        calendarEvents = calendarData.items || [];
      } else {
        calendarError = true;
      }
    } catch (err) {
      console.error(err);
      calendarError = true;
    }
  } else {
    calendarError = true;
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  // ---------------------------------------------------------
  // LÓGICA DE AGREGAÇÃO DE DADOS PARA O GRÁFICO (ÚLTIMOS 7 DIAS)
  // ---------------------------------------------------------
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse(); // Ordena do dia mais antigo para o de hoje

  const formattedChartData = last7Days.map(date => {
    // Pega o nome do dia da semana curto (ex: seg, ter, qua)
    const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    
    // Filtra as sessões que aconteceram especificamente nesta data
    const daySessions = sessions?.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === date.toDateString();
    }) || [];

    // Soma os minutos e converte para horas decimais (ex: 90 min = 1.5h)
    const totalMins = daySessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
    const totalHours = parseFloat((totalMins / 60).toFixed(1));

    return {
      name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      hours: totalHours
    };
  });

  // Métricas gerais consolidadas
  const totalMinutesAllTime = sessions?.reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;
  const totalHoursAllTime = (totalMinutesAllTime / 60).toFixed(1);
  const completedTasksCount = tasks?.filter(task => task.is_completed).length || 0;
  // ---------------------------------------------------------

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
    
    cookieStore.set({ name: 'google_provider_token', value: '', maxAge: 0 });
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
      await supabase.from("focus_sessions").insert({ duration_minutes: duration, user_id: user.id });
      revalidatePath("/dashboard");
    }
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

      {/* GRID DE MÉTRICAS ATUALIZADO: O primeiro card agora ocupa duas colunas para o gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              <span>Rendimento Semanal (Foco)</span>
              <span className="text-foreground font-bold text-base">Total: {totalHoursAllTime}h</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* INJEÇÃO DO COMPONENTE DO GRÁFICO */}
            <FocusChart data={formattedChartData} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Metas Cumpridas</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold mt-4">{completedTasksCount}</div></CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total de Tarefas</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold mt-4">{tasks?.length || 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Nova Meta / Tarefa</CardTitle></CardHeader>
            <CardContent>
              <ActionForm action={handleAddTask} successMessage="Nova meta adicionada!" resetOnSuccess className="space-y-4">
                <input type="text" name="title" placeholder="Ex: Estudar Matemática" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                <Button type="submit" className="w-full">Adicionar Meta</Button>
              </ActionForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Registro de Sessão de Foco</CardTitle></CardHeader>
            <CardContent>
              <ActionForm action={handleAddFocusSession} successMessage="Sessão de foco registrada com sucesso!" className="grid grid-cols-3 gap-3">
                <Button type="submit" name="duration" value="25" variant="secondary" className="flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> 25m</Button>
                <Button type="submit" name="duration" value="50" variant="secondary" className="flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> 50m</Button>
                <Button type="submit" name="duration" value="90" variant="secondary" className="flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> 90m</Button>
              </ActionForm>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Minhas Metas Atuais</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <li key={task.id} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm transition-all ${task.is_completed ? "bg-muted/50" : "bg-card"}`}>
                    <div className="flex items-center space-x-3">
                      <ActionForm action={handleToggleTask} successMessage={task.is_completed ? "Meta reaberta!" : "Meta concluída!"}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="is_completed" value={task.is_completed.toString()} />
                        <button type="submit" className="mt-1 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                          {task.is_completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                        </button>
                      </ActionForm>
                      <span className={`text-sm ${task.is_completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                    </div>
                    <ActionForm action={handleDeleteTask} successMessage="Meta apagada!">
                      <input type="hidden" name="id" value={task.id} />
                      <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </ActionForm>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma meta cadastrada ainda.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Agenda do Dia</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mt-2">
              {calendarError ? (
                <p className="text-sm text-amber-600 italic">Sessão expirada. Faça logout e login novamente para reautorizar a agenda.</p>
              ) : calendarEvents.length > 0 ? (
                calendarEvents.map((event: any) => {
                  const startTime = event.start?.dateTime 
                    ? new Date(event.start.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                    : "Dia todo";
                  
                  return (
                    <li key={event.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium line-clamp-2">{event.summary}</span>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground shrink-0">{startTime}</span>
                      </div>
                      
                      {event.hangoutLink && (
                        <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-primary hover:underline pt-1">
                          <Video className="h-3.5 w-3.5" /> Entrar no Meet
                        </a>
                      )}
                    </li>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum compromisso agendado para as próximas horas.</p>
              )}
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}