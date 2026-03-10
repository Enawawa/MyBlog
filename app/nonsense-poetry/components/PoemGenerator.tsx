"use client";

import { useState, useCallback } from "react";
import { generatePoem, ALL_TAGS } from "@/lib/poem-generator";
import Link from "next/link";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function PoemGeneratorWidget() {
  const [input, setInput] = useState("");
  const [poem, setPoem] = useState<{ id: string; lines: string[]; keywords: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(() => {
    setIsGenerating(true);

    setTimeout(() => {
      const keywords = input
        .split(/[,，\s、]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const seed = keywords.length > 0
        ? `g-${keywords.join("-")}-${Date.now()}`
        : `g-random-${Date.now()}-${Math.random()}`;

      const result = generatePoem(seed, keywords.length > 0 ? keywords : undefined);
      setPoem({ id: result.id, lines: result.lines, keywords: result.keywords });
      setIsGenerating(false);
    }, 600);
  }, [input]);

  const quickTags = ALL_TAGS.slice(0, 12);

  return (
    <div className="space-y-8">
      {/* Input area */}
      <div className="space-y-4">
        <label className="block text-sm text-slate-400">
          输入关键词（可选，多个用逗号或空格分隔）
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="如：加班、周一、咖啡"
            className="input-field flex-1"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <button
            onClick={generate}
            disabled={isGenerating}
            className="btn-primary whitespace-nowrap disabled:opacity-50"
          >
            {isGenerating ? "生成中..." : "✨ 生成废话"}
          </button>
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap gap-2">
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                const cur = input
                  .split(/[,，\s、]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (!cur.includes(tag)) {
                  setInput(cur.length > 0 ? `${input}、${tag}` : tag);
                }
              }}
              className="text-xs px-3 py-1 rounded-full border border-white/10 text-slate-500
                         hover:border-white/30 hover:text-white transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {poem && (
        <div className="animate-fade-in">
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="space-y-2 text-xl md:text-2xl leading-relaxed tracking-wide font-light text-center">
              {poem.lines.map((line, i) => (
                <p key={i} className="text-slate-100">{line}</p>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
              {poem.keywords.map((kw) => (
                <Link
                  key={kw}
                  href={`/nonsense-poetry/tag/${encodeURIComponent(kw)}`}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  #{kw}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button onClick={generate} className="btn-ghost text-sm">
              🎲 再来一首
            </button>
            <button
              onClick={() => {
                const text = poem.lines.join("\n") + "\n\n—— 废话文学生成器 no1sora.com";
                navigator.clipboard.writeText(text);
              }}
              className="btn-ghost text-sm"
            >
              📋 复制分享
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
