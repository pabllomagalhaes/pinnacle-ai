import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
// 1. IMPORTAÇÃO DO TOASTER
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PinnacleAI",
  description: "Painel de Performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        {children}
        {/* 2. ADIÇÃO DO COMPONENTE NA TELA (richColors deixa os alertas com cores vivas) */}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}