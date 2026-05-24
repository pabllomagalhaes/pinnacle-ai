"use client";

import { toast } from "sonner";
import { useRef } from "react";

interface ActionFormProps {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  successMessage: string;
  className?: string;
  resetOnSuccess?: boolean;
}

export function ActionForm({
  action,
  children,
  successMessage,
  className,
  resetOnSuccess = false,
}: ActionFormProps) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        // 1. Executa a ação pesada lá no servidor (Supabase)
        await action(formData);
        
        // 2. Dispara o Toast verde no navegador
        toast.success(successMessage);
        
        // 3. Limpa os campos do formulário (útil para o input de nova meta)
        if (resetOnSuccess) {
          ref.current?.reset();
        }
      }}
      className={className}
    >
      {children}
    </form>
  );
}