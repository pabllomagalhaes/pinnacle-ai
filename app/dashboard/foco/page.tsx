import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function FocoHistoryPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Histórico de Foco</h1>
      <Card>
        <CardHeader>
          <CardTitle>Todas as Sessões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{new Date(session.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{session.duration_minutes} minutos</TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium">Concluída</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}