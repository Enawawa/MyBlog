"use client";

import { createElement, useCallback, useEffect } from "react";
import Script from "next/script";

const SEARCH_WIDGET_CONFIG_ID = "ebe0b521-395d-4111-b5bf-cac3e5519763";
const SEARCH_WIDGET_TRIGGER_ID = "searchWidgetTrigger";
const AUTH_TOKEN_PLACEHOLDER = "<JWT or OAuth token provided by your backend>";

type SearchWidgetElement = Element & { authToken?: string };

export default function TreeholePage() {
  const setWidgetAuthToken = useCallback(() => {
    // Set authorization token.
    const searchWidget = document.querySelector(
      "gen-search-widget",
    ) as SearchWidgetElement | null;

    if (!searchWidget) return;

    searchWidget.authToken =
      process.env.NEXT_PUBLIC_SEARCH_WIDGET_AUTH_TOKEN ??
      AUTH_TOKEN_PLACEHOLDER;
  }, []);

  useEffect(() => {
    setWidgetAuthToken();
  }, [setWidgetAuthToken]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4 gradient-text inline-block">
        倾听树洞
      </h1>
      <p className="text-slate-400 mb-8">
        在搜索框里输入你的问题或想法，点击后即可唤起对话式搜索窗口。
      </p>

      {/* Widget JavaScript bundle */}
      <Script
        src="https://cloud.google.com/ai/gen-app-builder/client?hl=zh_CN"
        strategy="afterInteractive"
        onLoad={setWidgetAuthToken}
      />

      <section className="glass rounded-2xl p-6 space-y-4">
        {/* Search widget element is not visible by default */}
        {createElement("gen-search-widget", {
          configId: SEARCH_WIDGET_CONFIG_ID,
          triggerId: SEARCH_WIDGET_TRIGGER_ID,
        })}

        {/* Element that opens the widget on click. It does not have to be an input */}
        <input
          placeholder="在此处搜索"
          id={SEARCH_WIDGET_TRIGGER_ID}
          className="input-field"
        />

        <p className="text-xs text-slate-500">
          请在后端签发 JWT/OAuth token，并通过环境变量
          <code className="mx-1">NEXT_PUBLIC_SEARCH_WIDGET_AUTH_TOKEN</code>
          传入。
        </p>
      </section>

      <footer className="mt-16 py-8 text-center text-slate-600 text-sm border-t border-white/5">
        <p>Copyright &copy; 2024 Double All Rights Reserved.</p>
      </footer>
    </main>
  );
}
