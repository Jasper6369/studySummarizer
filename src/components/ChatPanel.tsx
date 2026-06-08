"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, DisplayLanguage, SummarizeResponse } from "@/lib/types";

type ChatPanelProps = {
  sourceContext: string;
  summary: SummarizeResponse;
  language: DisplayLanguage;
};

export function ChatPanel({ sourceContext, summary, language }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [sourceContext, summary, language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages,
          sourceContext,
          summary,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "回答失败，请重试。");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer as string },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "回答失败，请重试。");
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-slate-900">
          {language === "zh" ? "继续提问" : "Ask follow-up questions"}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {language === "zh"
            ? "基于当前总结和原文内容，向 AI 提问"
            : "Ask AI about the summary and source material"}
        </p>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-slate-400">
            {language === "zh"
              ? "例如：「这篇文章的核心论点是什么？」「有哪些适合课堂讨论的问题？」"
              : 'Try: "What is the main argument?" or "What could I discuss in class?"'}
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500">
              {language === "zh" ? "正在思考…" : "Thinking…"}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-100 px-5 py-4 sm:px-6"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              language === "zh" ? "输入你的问题…" : "Type your question…"
            }
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {language === "zh" ? "发送" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
