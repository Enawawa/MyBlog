import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | 废话文学 - Double's Blog",
    default: "废话文学 - Double's Blog",
  },
  description: "打工人废话文学生成器，自动生成富有哲理的废话短诗。996文学、打工人文学、摸鱼文学。",
  keywords: ["废话文学", "打工人文学", "996文学", "打工人诗", "摸鱼文学", "废话诗生成器"],
};

export default function NonsensePoetryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Sub-navigation */}
      <nav className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-1 h-12 text-sm overflow-x-auto">
          <Link
            href="/nonsense-poetry"
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
          >
            📜 废话首页
          </Link>
          <Link
            href="/nonsense-poetry/generator"
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
          >
            ✨ 生成器
          </Link>
          <span className="text-slate-700 mx-1">|</span>
          <Link
            href="/nonsense-poetry/tag/打工人"
            className="px-2 py-1 rounded text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap text-xs"
          >
            #打工人
          </Link>
          <Link
            href="/nonsense-poetry/tag/加班"
            className="px-2 py-1 rounded text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap text-xs"
          >
            #加班
          </Link>
          <Link
            href="/nonsense-poetry/tag/摸鱼"
            className="px-2 py-1 rounded text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap text-xs"
          >
            #摸鱼
          </Link>
          <Link
            href="/nonsense-poetry/tag/996"
            className="px-2 py-1 rounded text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap text-xs"
          >
            #996
          </Link>
        </div>
      </nav>

      {children}
    </div>
  );
}
