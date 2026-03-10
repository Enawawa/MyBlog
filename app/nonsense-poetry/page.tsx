import type { Metadata } from "next";
import Link from "next/link";
import { generateDailyPoems, getRecentPoems, getTodayStr, ALL_TAGS } from "@/lib/poem-generator";
import PoemCard from "./components/PoemCard";
import PoemList from "./components/PoemList";
import TagList from "./components/TagList";

export const metadata: Metadata = {
  title: "废话文学 — 打工人废话诗生成器",
  description:
    "每日自动生成打工人废话短诗。观察、描述、重复、因果循环、轻微荒诞 — 这就是废话文学。",
};

export default function NonsensePoetryHome() {
  const today = getTodayStr();
  const todayPoems = generateDailyPoems(today, 50);
  const featuredPoem = todayPoems[0];
  const latestPoems = todayPoems.slice(1, 13);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          <span className="gradient-text">废话文学</span>
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
          打工人废话诗生成器 — 用最多的文字表达最少的意思
        </p>
        <Link href="/nonsense-poetry/generator" className="btn-primary inline-block">
          ✨ 开始生成废话
        </Link>
      </section>

      {/* Today's Featured */}
      <section className="mb-16">
        <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-6">
          📌 今日废话
        </h2>
        <div className="glass rounded-2xl p-8 md:p-12 text-center">
          <div className="space-y-2 text-xl md:text-2xl leading-relaxed tracking-wide font-light max-w-lg mx-auto">
            {featuredPoem.lines.map((line, i) => (
              <p key={i} className="text-slate-200">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
            {featuredPoem.keywords.map((kw) => (
              <Link
                key={kw}
                href={`/nonsense-poetry/tag/${encodeURIComponent(kw)}`}
                className="text-xs px-3 py-1 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                #{kw}
              </Link>
            ))}
          </div>
          <Link
            href={`/nonsense-poetry/post/${featuredPoem.id}`}
            className="inline-block mt-6 text-sm text-slate-500 hover:text-white transition-colors"
          >
            查看详情 →
          </Link>
        </div>
      </section>

      {/* Hot Tags */}
      <section className="mb-16">
        <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-6">
          🏷️ 热门关键词
        </h2>
        <TagList tags={ALL_TAGS} />
      </section>

      {/* Latest Poems */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm uppercase tracking-widest text-slate-500">
            📝 最新废话
          </h2>
          <span className="text-xs text-slate-600">{today} · 每日自动生成</span>
        </div>
        <PoemList poems={latestPoems} columns={2} />
      </section>

      {/* Footer */}
      <footer className="pt-12 pb-8 text-center border-t border-white/5">
        <p className="text-slate-600 text-sm">
          每天自动生成 50 首废话诗 · 废话文学生成器 ·{" "}
          <Link href="/" className="hover:text-slate-400 transition-colors">
            Double&apos;s Blog
          </Link>
        </p>
      </footer>
    </main>
  );
}
