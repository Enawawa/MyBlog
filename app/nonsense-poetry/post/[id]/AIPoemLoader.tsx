"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShareButton from "../../components/ShareButton";

interface AIPoem {
  id: string;
  lines: string[];
  keywords: string[];
  createdAt: string;
}

export default function AIPoemLoader({ id }: { id: string }) {
  const [poem, setPoem] = useState<AIPoem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/poem/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setPoem(data);
        setLoading(false);
      })
      .catch(() => {
        setError("诗歌不存在或已过期");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-slate-500 mt-4">加载中…</p>
      </main>
    );
  }

  if (error || !poem) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-2xl mb-4">😶</p>
        <p className="text-slate-400 mb-6">{error || "诗歌不存在"}</p>
        <Link href="/nonsense-poetry/generator" className="btn-primary inline-block">
          去生成一首新的
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <article className="mb-16">
        <div className="glass rounded-2xl p-8 md:p-16 text-center">
          <div className="space-y-3 text-2xl md:text-3xl leading-relaxed tracking-wide font-light">
            {poem.lines.map((line, i) => (
              <p key={i} className="text-slate-100">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {poem.keywords.map((kw) => (
              <Link
                key={kw}
                href={`/nonsense-poetry/tag/${encodeURIComponent(kw)}`}
                className="text-sm px-4 py-1.5 rounded-full border border-white/10 text-slate-400 hover:border-white/30 hover:text-white transition-all"
              >
                #{kw}
              </Link>
            ))}
          </div>
          <time className="text-sm text-slate-600">{poem.createdAt}</time>
          <p className="text-xs text-slate-600">由 Gemini AI 生成</p>
          <ShareButton lines={poem.lines} />
        </div>
      </article>

      <div className="text-center">
        <Link
          href="/nonsense-poetry/generator"
          className="btn-primary inline-block"
        >
          ✨ 再生成一首
        </Link>
      </div>
    </main>
  );
}
