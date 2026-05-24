import { createBrowserClient } from '@supabase/ssr'

// Ao usar o createBrowserClient do @supabase/ssr, 
// ele automaticamente configura o fluxo PKCE (seguro para servidores)
// e salva os cookies corretamente no formato Next.js 15+
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)