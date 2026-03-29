import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModalProvider } from "@/components/Modal";
import { NavBar } from "@/components/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "智习 - 间隔重复学习系统",
  description: "基于艾宾浩斯遗忘曲线的间隔重复学习系统，助你高效备考高级经济师",
  keywords: ["学习", "间隔重复", "记忆", "艾宾浩斯", "备考", "高级经济师"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
        <ThemeProvider>
          <ModalProvider>
            <div className="min-h-screen flex flex-col">
              <NavBar />
              <main className="flex-1 pb-20 md:pb-8">
                {children}
              </main>
            </div>
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}