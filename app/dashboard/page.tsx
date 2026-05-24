import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Trash2, CheckCircle2, Circle, Clock, Calendar, Video, CalendarPlus } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { FocusChart } from "@/components/FocusChart";
import { Badge } from "@/components/ui/badge";
import { AIModal } from "@/components/AIModal";
import { PomodoroTimer } from "@/components/PomodoroTimer";

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

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const formattedChartData = last7Days.map(date => {
    const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const daySessions = sessions?.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === date.toDateString();
    }) || [];
    const totalMins = daySessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
    const totalHours = parseFloat((totalMins / 60).toFixed(1));
    return { name: dayName.charAt(0).toUpperCase() + dayName.slice(1), hours: totalHours };
  });

  const totalMinutesAllTime = sessions?.reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;
  const totalHoursAllTime = (totalMinutesAllTime / 60).toFixed(1);
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
    
    cookieStore.set({ name: 'google_provider_token', value: '', maxAge: 0 });
    await supabase.auth.signOut();
    redirect("/login");
  }

  async function handleAddTask(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const category = formData.get("category") as string || "Geral";
    if (!title) return;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value; }, set() {}, remove() {} }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("tasks").insert({ title, category, user_id: user.id });
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

  // NOVA SERVER ACTION: Cria o evento diretamente no Google Calendar do usuário
  async function handleScheduleStudy(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    
    if (!title || !date || !time) return;

    const cookieStore = await cookies();
    const providerToken = cookieStore.get("google_provider_token")?.value;

    if (!providerToken) return;

    // Combina data e hora para criar o objeto Date
    const startDateTime = new Date(`${date}T${time}:00`);
    // Define o fim da sessão padrão em +1 hora (60 minutos)
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    try {
      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `📚 Estudar: ${title}`,
          description: "Sessão de estudos agendada através do PinnacleAI.",
          start: { 
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Pega o fuso horário automático
          },
          end: { 
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 10 } // Dispara notificação no celular 10 min antes
            ]
          }
        }),
      });

      // Força a atualização do terceiro card da Dashboard imediatamente
      revalidatePath("/dashboard");
    } catch (error) {
      console.error("Erro na integração com o Google Calendar API:", error);
    }
  }

  // MAPEA CATEGORIAS DE ESTUDO PARA CORES
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Leitura": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Revisão": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Exercícios": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Trabalho/TCC": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Performance</h1>
          <p className="text-muted-foreground mt-2">Bem-vindo, {user.email}.</p>
        </div>
       
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              <span>Rendimento Semanal (Foco)</span>
              <span className="text-foreground font-bold text-base">Total: {totalHoursAllTime}h</span>
            </CardTitle>
          </CardHeader>
          <CardContent><FocusChart data={formattedChartData} /></CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Metas Cumpridas</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold mt-4">{completedTasksCount}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total de Tarefas</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold mt-4">{tasks?.length || 0}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        
        {/* COLUNA DA ESQUERDA: ENTRADAS DE DADOS */}
        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Novo Tópico de Estudo</CardTitle></CardHeader>
            <CardContent>
              <ActionForm action={handleAddTask} successMessage="Item adicionado ao seu cronograma!" resetOnSuccess className="space-y-4">
                <input type="text" name="title" placeholder="Ex: Matrizes e Determinantes" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                <select name="category" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                  <option value="Leitura">Leitura de Material</option>
                  <option value="Revisão">Revisão para Prova</option>
                  <option value="Exercícios">Lista de Exercícios</option>
                  <option value="Trabalho/TCC">Trabalho Acadêmico / TCC</option>
                  <option value="Geral">Estudo Geral</option>
                </select>
                <Button type="submit" className="w-full">Registrar Matéria</Button>
              </ActionForm>
            </CardContent>
          </Card>

          {/* NOVO CARD DE AGENDAMENTO NO GOOGLE CALENDAR */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarPlus className="h-4 w-4 text-primary" /> Agendar Alerta de Estudo</CardTitle></CardHeader>
            <CardContent>
              <ActionForm action={handleScheduleStudy} successMessage="Sessão enviada para o seu Google Calendar!" resetOnSuccess className="space-y-4">
                <input type="text" name="title" placeholder="Matéria (Ex: Revisão de Cálculo I)" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" name="date" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                  <input type="time" name="time" className="w-full p-2 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
                <Button type="submit" variant="secondary" className="w-full">Fixar na Agenda do Celular</Button>
              </ActionForm>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-center">Modo Foco</CardTitle>
            </CardHeader>
            <CardContent>
              <PomodoroTimer addSessionAction={handleAddFocusSession} />
            </CardContent>
          </Card>
        </div>

        {/* COLUNA CENTRAL: SEU BANCO DE CONTEÚDOS ACADÊMICOS */}
        <Card>
          <CardHeader><CardTitle>Conteúdos Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <li key={task.id} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm transition-all ${task.is_completed ? "bg-muted/50" : "bg-card"}`}>
                    <div className="flex items-center space-x-3 w-full pr-4">
                      <ActionForm action={handleToggleTask} successMessage={task.is_completed ? "Tarefa pendente!" : "Tarefa concluída!"}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="is_completed" value={task.is_completed.toString()} />
                        <button type="submit" className="mt-1 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                          {task.is_completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                        </button>
                      </ActionForm>
                      <div className="flex flex-col gap-1 w-full">
  <div className="flex items-center gap-2">
    <span className={`text-sm ${task.is_completed ? "line-through text-muted-foreground" : ""}`}>
      {task.title}
    </span>
    {/* 2. INJEÇÃO DO ASSISTENTE DE IA AO LADO DO TÍTULO */}
    {!task.is_completed && (
      <AIModal taskTitle={task.title} taskCategory={task.category} />
    )}
  </div>
  {task.category && (
    <Badge variant="outline" className={`w-fit text-[10px] px-1.5 py-0 font-normal ${task.is_completed ? "opacity-50" : ""} ${getCategoryColor(task.category)}`}>
      {task.category}
    </Badge>
  )}
</div>
                    </div>
                    <ActionForm action={handleDeleteTask} successMessage="Matéria removida!">
                      <input type="hidden" name="id" value={task.id} />
                      <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </ActionForm>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum assunto mapeado.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* COLUNA DA DIREITA: COMPROMISSOS EM TEMPO REAL DO GOOGLE CALENDAR */}
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