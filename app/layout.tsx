import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Double's Blog",
  description: "人生是旷野，不是轨道",
};

function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 glass border-t-0 border-x-0">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          Double&apos;s Blog
        </Link>
        <nav className="flex items-center gap-1 text-sm overflow-x-auto min-w-0 whitespace-nowrap max-md:px-1">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            首页
          </Link>
          <Link
            href="/daily"
            className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            日常小记
          </Link>
          <Link
            href="/thoughts"
            className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            碎片感受
          </Link>
          <Link
            href="/clipboard"
            className="px-3 py-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
          >
            📋 共享剪贴板
          </Link>
          <Link
            href="/game"
            className="px-3 py-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
          >
            🎮 飞跃小鸟
          </Link>
          <Link
            href="/#games"
            className="px-3 py-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
          >
            🕹️ 3D游戏
          </Link>
          <a
            href="/trending.html"
            className="px-3 py-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
          >
            ✦ 设计灵感
          </a>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Navbar />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
