import type { Metadata } from "next";
import Link from "next/link";
import { generatePoemsByKeyword, ALL_TAGS } from "@/lib/poem-generator";
import PoemList from "../../components/PoemList";
import TagList from "../../components/TagList";

interface Props {
  params: { keyword: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const keyword = decodeURIComponent(params.keyword);
  return {
    title: `#${keyword} — 废话文学`,
    description: `关于「${keyword}」的打工人废话短诗合集。废话文学生成器自动创作。`,
    keywords: [keyword, "废话文学", "打工人文学", "打工人诗"],
  };
}

export default function TagPage({ params }: Props) {
  const keyword = decodeURIComponent(params.keyword);
  const poems = generatePoemsByKeyword(keyword, 20);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <section className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          <span className="gradient-text">#{keyword}</span>
        </h1>
        <p className="text-slate-400">
          关于「{keyword}」的废话文学作品
        </p>
        <p className="text-slate-600 text-sm mt-2">{poems.length} 首废话诗</p>
      </section>

      {/* Tag Navigation */}
      <section className="mb-10">
        <TagList tags={ALL_TAGS} activeTag={keyword} />
      </section>

      {/* Poem List */}
      <PoemList poems={poems} columns={2} />

      {/* Footer */}
      <footer className="mt-16 pt-8 text-center border-t border-white/5">
        <Link
          href="/nonsense-poetry"
          className="text-slate-500 hover:text-white transition-colors text-sm"
        >
          ← 返回废话文学首页
        </Link>
      </footer>
    </main>
  );
}
