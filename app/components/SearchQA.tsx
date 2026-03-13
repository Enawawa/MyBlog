"use client";

import { FormEvent, useRef, useState } from "react";

const SEARCH_TOKEN_ENDPOINT =
  process.env.NEXT_PUBLIC_SEARCH_TOKEN_ENDPOINT || "/api/auth/token";
const SEARCH_API_ENDPOINT =
  process.env.NEXT_PUBLIC_SEARCH_API_ENDPOINT || "/api/search";
const SEARCH_CLIENT_ID =
  process.env.NEXT_PUBLIC_SEARCH_CLIENT_ID || "myblog-web";

interface SearchResult {
  question: string;
  answer: string;
}

export default function SearchQA() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const getToken = async () => {
    if (tokenRef.current) return tokenRef.current;

    const response = await fetch(SEARCH_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "x-client-id": SEARCH_CLIENT_ID,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "获取访问凭证失败");
    }
    tokenRef.current = data.token;
    return data.token as string;
  };

  const askQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (normalizedQuestion.length < 2) {
      setError("请输入至少 2 个字符的问题");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      const response = await fetch(SEARCH_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: normalizedQuestion }),
      });

      if (response.status === 401) {
        tokenRef.current = null;
        throw new Error("访问凭证已过期，请重试");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "搜索失败");
      }
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "搜索失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-10">
      <div className="glass rounded-2xl p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100">
            🔎 站内问答搜索
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            输入你的问题，系统会返回站内功能相关答案
          </p>
        </div>

        <form className="flex flex-col sm:flex-row gap-3" onSubmit={askQuestion}>
          <input
            type="text"
            className="input-field flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="例如：怎么生成废话诗？"
            aria-label="输入问题"
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "检索中..." : "提问"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-400 mt-4" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">问题：{result.question}</p>
            <p className="text-slate-100 mt-2 leading-7">答案：{result.answer}</p>
          </div>
        )}
      </div>
    </section>
  );
}
