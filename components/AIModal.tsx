"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2 } from "lucide-react";

interface AIModalProps {
  taskTitle: string;
  taskCategory: string;
}

export function AIModal({ taskTitle, taskCategory }: AIModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiContent, setAiContent] = useState<string | null>(null);

  const handleOpenAssistant = async () => {
    setIsOpen(true);
    if (aiContent) return; // Evita chamar a API de novo se já gerou para este item

    setLoading(true);
    try {
      const response = await fetch("/api/study-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskTitle, category: taskCategory }),
      });
      const data = await response.json();
      if (data.content) {
        setAiContent(data.content);
      } else {
        setAiContent("<p class='text-destructive'>Erro ao carregar o tutor de IA.</p>");
      }
    } catch (err) {
      setAiContent("<p class='text-destructive'>Erro de conexão com o assistente.</p>");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenAssistant}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
        title="Estudar com IA"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-card h-full p-6 shadow-2xl flex flex-col border-l border-border animate-slide-in">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h2 className="font-bold text-lg text-foreground">Tutor de IA: {taskTitle}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm text-foreground/90 leading-relaxed">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  <p className="italic text-xs animate-pulse">O Gemini está a formular o seu plano de estudos...</p>
                </div>
              ) : (
                <div 
                  className="prose dark:prose-invert max-w-none space-y-4 html-content"
                  dangerouslySetInnerHTML={{ __html: aiContent || "" }} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}