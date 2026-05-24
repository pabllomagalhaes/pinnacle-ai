import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. IMPORTAÇÃO DO TOASTER
import { Toaster } from "@/components/ui/sonner";

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        {/* 2. ADIÇÃO DO COMPONENTE NA TELA (richColors deixa os alertas com cores vivas) */}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}