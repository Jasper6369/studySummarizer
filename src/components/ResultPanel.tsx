"use client";

import { useCallback, useEffect, useState } from "react";
import type { PurposeOption } from "@/lib/summary-purposes";
import type { DisplayLanguage, SummarizeResponse } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";

type ResultPanelProps = {
  result: SummarizeResponse;
  initialLanguage: DisplayLanguage;
  purpose?: PurposeOption;
  sourceContext?: string;
};

export function ResultPanel({
  result,
  initialLanguage,
  purpose,
  sourceContext = "",
}: ResultPanelProps) {
  const [displayLanguage, setDisplayLanguage] =
    useState<DisplayLanguage>(initialLanguage);
  const [displayResult, setDisplayResult] = useState(result);
  const [cache, setCache] = useState<
    Partial<Record<DisplayLanguage, SummarizeResponse>>
  >({ [initialLanguage]: result });
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    setDisplayLanguage(initialLanguage);
    setDisplayResult(result);
    setCache({ [initialLanguage]: result });
    setTranslateError(null);
  }, [result, initialLanguage]);

  const switchLanguage = useCallback(
    async (lang: DisplayLanguage) => {
      if (lang === displayLanguage || translating) return;

      setTranslateError(null);

      if (cache[lang]) {
        setDisplayLanguage(lang);
        setDisplayResult(cache[lang]!);
        return;
      }

      setTranslating(true);

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: displayResult, targetLanguage: lang }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "切换语言失败，请重试。");
        }

        const translated = data as SummarizeResponse;
        setCache((prev) => ({ ...prev, [lang]: translated }));
        setDisplayLanguage(lang);
        setDisplayResult(translated);
      } catch (err) {
        setTranslateError(
          err instanceof Error ? err.message : "切换语言失败，请重试。"
        );
      } finally {
        setTranslating(false);
      }
    },
    [cache, displayLanguage, displayResult, translating]
  );

  const copyText = async (label: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(label);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const copyAll = () => {
    const parts = [
      "## Summary\n" + displayResult.summary,
      "\n## Bullet Points\n" +
        displayResult.bulletPoints.map((p) => `• ${p}`).join("\n"),
      "\n## Keywords\n" + displayResult.keywords.join(", "),
    ];
    if (displayResult.simpleExplanation) {
      parts.push("\n## Simple Explanation\n" + displayResult.simpleExplanation);
    }
    copyText("all", parts.join("\n"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">总结结果</h2>
          {purpose && (
            <p className="mt-1 text-xs text-slate-500">
              <span className="mr-1">{purpose.icon}</span>
              为「{purpose.labelZh}」定制 · {purpose.labelEn}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => switchLanguage("zh")}
              disabled={translating}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                displayLanguage === "zh"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              } disabled:opacity-50`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => switchLanguage("en")}
              disabled={translating}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                displayLanguage === "en"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              } disabled:opacity-50`}
            >
              English
            </button>
          </div>

          <button
            onClick={copyAll}
            disabled={translating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
          >
            <CopyIcon />
            {copiedSection === "all" ? "已复制！" : "复制全部"}
          </button>
        </div>
      </div>

      {translating && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          <SpinnerIcon />
          正在切换语言…
        </div>
      )}

      {translateError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {translateError}
        </div>
      )}

      <div className={translating ? "pointer-events-none opacity-60" : ""}>
        <ResultCard
          title="Summary"
          subtitle={displayLanguage === "zh" ? "主要内容总结" : "Main summary"}
          icon={<SummaryIcon />}
          accent="brand"
          onCopy={() => copyText("summary", displayResult.summary)}
          copied={copiedSection === "summary"}
        >
          <p className="text-sm leading-relaxed text-slate-700">
            {displayResult.summary}
          </p>
        </ResultCard>

        <div className="mt-4">
          <ResultCard
            title="Bullet Points"
            subtitle={displayLanguage === "zh" ? "重点要点" : "Key points"}
            icon={<ListIcon />}
            accent="emerald"
            onCopy={() =>
              copyText(
                "bullets",
                displayResult.bulletPoints.map((p) => `• ${p}`).join("\n")
              )
            }
            copied={copiedSection === "bullets"}
          >
            <ul className="space-y-2">
              {displayResult.bulletPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm leading-relaxed text-slate-700"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {point}
                </li>
              ))}
            </ul>
          </ResultCard>
        </div>

        <div className="mt-4">
          <ResultCard
            title="Keywords"
            subtitle={displayLanguage === "zh" ? "关键词" : "Keywords"}
            icon={<TagIcon />}
            accent="brand"
            onCopy={() =>
              copyText("keywords", displayResult.keywords.join(", "))
            }
            copied={copiedSection === "keywords"}
          >
            <div className="flex flex-wrap gap-2">
              {displayResult.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200/60"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </ResultCard>
        </div>

        {displayResult.simpleExplanation && (
          <div className="mt-4">
            <ResultCard
              title="Simple Explanation"
              subtitle={
                displayLanguage === "zh"
                  ? "通俗解释 · 适合学生理解"
                  : "Plain explanation for students"
              }
              icon={<BookIcon />}
              accent="violet"
              onCopy={() =>
                copyText("simple", displayResult.simpleExplanation!)
              }
              copied={copiedSection === "simple"}
            >
              <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                {displayResult.simpleExplanation.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </ResultCard>
          </div>
        )}
      </div>

      <div className="mt-4">
        <ChatPanel
          sourceContext={sourceContext}
          summary={displayResult}
          language={displayLanguage}
        />
      </div>
    </div>
  );
}

type Accent = "brand" | "emerald" | "amber" | "violet";

const accentStyles: Record<Accent, { bg: string; text: string; ring: string }> =
  {
    brand: { bg: "bg-brand-50", text: "text-brand-700", ring: "ring-brand-100" },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-100",
    },
    amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      ring: "ring-violet-100",
    },
  };

function ResultCard({
  title,
  subtitle,
  icon,
  accent,
  children,
  onCopy,
  copied,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: Accent;
  children: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
}) {
  const styles = accentStyles[accent];

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.bg} ${styles.text} ring-1 ${styles.ring}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onCopy}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          title="复制"
        >
          {copied ? (
            <span className="text-xs font-medium text-emerald-600">✓</span>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>
      <div className="px-5 py-4 sm:px-6 sm:py-5">{children}</div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
