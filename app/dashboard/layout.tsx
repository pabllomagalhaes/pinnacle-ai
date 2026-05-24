import Link from "next/link";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/app/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Persistente */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">PinnacleAI</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              📊 Painel Principal
            </Button>
          </Link>
          <Link href="/dashboard/foco">
            <Button variant="ghost" className="w-full justify-start text-slate-500">
              ⏱️ Histórico de Foco
            </Button>
          </Link>
          <Link href="/dashboard/calendario">
            <Button variant="ghost" className="w-full justify-start text-slate-500">
              📅 Calendário
            </Button>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          {/* Formulário chamando a Server Action de Logout */}
          <form action={handleSignOut}>
            <Button type="submit" variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}