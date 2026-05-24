"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface PomodoroTimerProps {
  // Recebe a Server Action do Next.js para salvar no banco
  addSessionAction: (formData: FormData) => Promise<void>;
}

export function PomodoroTimer({ addSessionAction }: PomodoroTimerProps) {
  const [durationMins, setDurationMins] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      
      // Dispara a requisição para o servidor (Supabase) silenciosamente
      const formData = new FormData();
      formData.append("duration", durationMins.toString());
      addSessionAction(formData);
      
      // Reseta para o próximo ciclo e avisa o usuário
      setTimeLeft(durationMins * 60);
      alert(`🎉 Parabéns! Sessão de ${durationMins} minutos concluída e registrada!`);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, durationMins, addSessionAction]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durationMins * 60);
  };

  const setMode = (mins: number) => {
    setIsActive(false);
    setDurationMins(mins);
    setTimeLeft(mins * 60);
  };

  // Formata os segundos para o formato visual MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* Botões de Seleção de Tempo */}
      <div className="flex space-x-2">
        <Button variant={durationMins === 25 ? "default" : "outline"} onClick={() => setMode(25)} size="sm" className="w-16">25m</Button>
        <Button variant={durationMins === 50 ? "default" : "outline"} onClick={() => setMode(50)} size="sm" className="w-16">50m</Button>
        <Button variant={durationMins === 90 ? "default" : "outline"} onClick={() => setMode(90)} size="sm" className="w-16">90m</Button>
      </div>

      {/* Relógio Digital */}
      <div className="text-6xl font-bold tracking-tighter text-slate-800 tabular-nums">
        {formatTime(timeLeft)}
      </div>

      {/* Controles Play/Pause e Reset */}
      <div className="flex space-x-4">
        <Button onClick={toggleTimer} size="icon" variant={isActive ? "secondary" : "default"} className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105">
          {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </Button>
        <Button onClick={resetTimer} size="icon" variant="outline" className="h-14 w-14 rounded-full">
          <RotateCcw className="h-5 w-5 text-slate-500" />
        </Button>
      </div>
    </div>
  );
}