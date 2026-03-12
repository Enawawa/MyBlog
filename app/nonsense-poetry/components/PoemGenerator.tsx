"use client";

import { useState, useCallback } from "react";
import { ALL_TAGS } from "@/lib/poem-generator";
import Link from "next/link";

export default function PoemGeneratorWidget() {
  const [input, setInput] = useState("");
  const [poem, setPoem] = useState<{
    id: string;
    lines: string[];
    keywords: string[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setError("");
    setIsGenerating(true);
    setCopied(false);

    const keywords = input
      .split(/[,，\s、]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      setError("请至少输入一个关键词");
      setIsGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/generate-poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "生成失败，请重试");
        setIsGenerating(false);
        return;
      }

      setPoem({ id: data.id, lines: data.lines, keywords: data.keywords });
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setIsGenerating(false);
    }
  }, [input]);

  const copyPoem = useCallback(() => {
    if (!poem) return;
    const text =
      poem.lines.join("\n") +
      "\n\n—— 废话文学生成器 no1sora.com/nonsense-poetry";
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [poem]);

  const quickTags = ALL_TAGS.slice(0, 12);

  return (
    <div className="space-y-8">
      {/* Input */}
      <div className="space-y-4">
        <label className="block text-sm text-slate-400">
          输入关键词（多个用逗号或空格分隔）
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="如：加班、周一、咖啡"
            className="input-field flex-1"
            onKeyDown={(e) => e.key === "Enter" && !isGenerating && generate()}
            disabled={isGenerating}
          />
          <button
            onClick={generate}
            disabled={isGenerating}
            className="btn-primary whitespace-nowrap disabled:opacity-50 min-w-[120px]"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                生成中…
              </span>
            ) : (
              "✨ 生成废话"
            )}
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

      {/* Error */}
      {error && (
        <div className="text-center text-red-400 text-sm glass rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Result */}
      {poem && (
        <div className="animate-fade-in">
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="space-y-2 text-xl md:text-2xl leading-relaxed tracking-wide font-light text-center">
              {poem.lines.map((line, i) => (
                <p key={i} className="text-slate-100">
                  {line}
                </p>
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
            <p className="text-center text-xs text-slate-600 mt-4">
              由 Gemini AI 生成 · ID: {poem.id}
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <button onClick={generate} className="btn-ghost text-sm" disabled={isGenerating}>
              🎲 再来一首
            </button>
            <button onClick={copyPoem} className="btn-ghost text-sm">
              {copied ? "✅ 已复制" : "📋 复制分享"}
            </button>
            <Link
              href={`/nonsense-poetry/post/${poem.id}`}
              className="btn-ghost text-sm inline-block"
            >
              🔗 分享链接
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
