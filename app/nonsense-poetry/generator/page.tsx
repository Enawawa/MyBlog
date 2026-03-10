import type { Metadata } from "next";
import PoemGeneratorWidget from "../components/PoemGenerator";

export const metadata: Metadata = {
  title: "废话生成器",
  description:
    "输入关键词，一键生成打工人废话短诗。加班、摸鱼、996、周一——总有一首废话属于你。",
};

export default function GeneratorPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <section className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          <span className="gradient-text">✨ 废话生成器</span>
        </h1>
        <p className="text-slate-400">
          输入你的打工关键词，系统为你量身定制一首废话诗
        </p>
      </section>

      <PoemGeneratorWidget />
    </main>
  );
}
