"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addHistoryEntry,
  clearHistory,
  createHistoryEntry,
  loadHistory,
  removeHistoryEntry,
  type HistoryEntry,
} from "@/lib/history";
import type { SummaryPurpose } from "@/lib/summary-purposes";
import { getPurposeOption } from "@/lib/summary-purposes";
import type { DisplayLanguage, SummarizeResponse } from "@/lib/types";
import { HistoryPanel } from "./HistoryPanel";
import { PurposeSelector } from "./PurposeSelector";
import { ResultPanel } from "./ResultPanel";

const ACCEPTED_TYPES = [
  ".txt",
  ".md",
  ".markdown",
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
];
const TEXT_TYPES = [".txt", ".md", ".markdown"];
const MAX_CHARS = 50000;
const MIN_CHARS = 50;
const MAX_FILE_SIZE = 4 * 1024 * 1024;

type Language = "auto" | "zh" | "en";

function detectLanguage(text: string): DisplayLanguage {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return cjk > text.length * 0.1 ? "zh" : "en";
}

function getFileExtension(filename: string): string {
  return "." + filename.split(".").pop()?.toLowerCase();
}

export function SummarizerApp() {
  const [text, setText] = useState("");
  const [includeSimpleExplanation, setIncludeSimpleExplanation] = useState(true);
  const [language, setLanguage] = useState<Language>("auto");
  const [purpose, setPurpose] = useState<SummaryPurpose>("quick_understanding");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [resultLanguage, setResultLanguage] = useState<DisplayLanguage>("zh");
  const [fileName, setFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const charCount = text.length;
  const isBusy = loading || extracting;
  const canSubmit = charCount >= MIN_CHARS && !isBusy;

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const scrollToResults = useCallback(() => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleSelectHistory = useCallback(
    (entry: HistoryEntry) => {
      setActiveHistoryId(entry.id);
      setResult(entry.result);
      setResultLanguage(entry.resultLanguage);
      setPurpose(entry.purpose);
      setFileName(entry.fileName);
      setError(null);
      scrollToResults();
    },
    [scrollToResults]
  );

  const handleDeleteHistory = useCallback(
    (id: string) => {
      setHistory(removeHistoryEntry(id));
      if (activeHistoryId === id) {
        setActiveHistoryId(null);
        setResult(null);
      }
    },
    [activeHistoryId]
  );

  const handleClearHistory = useCallback(() => {
    if (!window.confirm("确定清空全部历史记录吗？")) return;
    setHistory(clearHistory());
    setActiveHistoryId(null);
    setResult(null);
  }, []);

  const activeEntry =
    activeHistoryId != null
      ? history.find((entry) => entry.id === activeHistoryId)
      : undefined;

  const sourceContext = (text.trim() || activeEntry?.sourceExcerpt || "").slice(
    0,
    8000
  );

  const processFile = useCallback(async (file: File) => {
    const ext = getFileExtension(file.name);

    if (!ACCEPTED_TYPES.includes(ext)) {
      setError(
        `暂不支持该文件格式。请上传 ${ACCEPTED_TYPES.join("、")} 文件。`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("文件大小不能超过 4MB。");
      return;
    }

    setError(null);
    setResult(null);
    setExtractNotice(null);

    if (TEXT_TYPES.includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          setText(content.slice(0, MAX_CHARS));
          setFileName(file.name);
        }
      };
      reader.onerror = () => setError("读取文件失败，请重试。");
      reader.readAsText(file);
      return;
    }

    setExtracting(true);
    setFileName(file.name);
    setExtractStatus(
      ext === ".pdf"
        ? "正在云端 OCR 识别 PDF 文字…"
        : [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].includes(ext)
          ? "正在识别图片中的文字…"
          : "正在读取文档…"
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "文档读取失败，请重试。");
      }

      setText(data.text);
      setFileName(data.fileName ?? file.name);
      setExtractNotice(data.message ?? null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "文档读取失败，请重试。";
      setError(
        msg.includes("fetch") || msg.includes("Failed to fetch")
          ? "连接失败：请确认网站已部署且网络正常。本地测试需先运行 npm run dev。"
          : msg
      );
      setFileName(null);
      setExtractNotice(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setExtracting(false);
      setExtractStatus(null);
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await processFile(file);
    },
    [processFile]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (isBusy) return;
      dragCounterRef.current += 1;
      setIsDragging(true);
    },
    [isBusy]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (isBusy) return;

      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      await processFile(file);
    },
    [isBusy, processFile]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveHistoryId(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          includeSimpleExplanation,
          language,
          purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "总结失败，请稍后重试。");
      }

      const summary = data as SummarizeResponse;
      setResult(summary);

      const displayLang: DisplayLanguage =
        language === "auto" ? detectLanguage(summary.summary) : language;
      setResultLanguage(displayLang);

      const entry = createHistoryEntry({
        text,
        fileName,
        purpose,
        resultLanguage: displayLang,
        result: summary,
      });
      setHistory(addHistoryEntry(entry));
      setActiveHistoryId(entry.id);

      scrollToResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "总结失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setFileName(null);
    setResult(null);
    setError(null);
    setExtractNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <HistoryPanel
          entries={history}
          activeId={activeHistoryId}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onClearAll={handleClearHistory}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`rounded-2xl border bg-white shadow-card transition-colors ${
            isDragging
              ? "border-brand-400 ring-2 ring-brand-100"
              : "border-slate-200/80"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-slate-900">
                  粘贴或上传内容
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  支持拖拽上传 · PDF · Word · 图片 OCR · 文本
                </p>
              </div>
              {fileName && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  📄 {fileName}
                </span>
              )}
            </div>
          </div>

          <PurposeSelector
            value={purpose}
            onChange={setPurpose}
            disabled={isBusy}
          />

          <div className="relative p-5 sm:p-6">
            {isDragging && (
              <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/90">
                <div className="text-center">
                  <p className="text-sm font-semibold text-brand-700">
                    松开鼠标即可上传
                  </p>
                  <p className="mt-1 text-xs text-brand-600">
                    支持 .pdf .docx .jpg .png .webp .txt
                  </p>
                </div>
              </div>
            )}

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_CHARS));
                setFileName(null);
                setError(null);
              }}
              placeholder="在这里粘贴你的文章、阅读材料或学习笔记…&#10;&#10;也可以拖拽或上传 PDF / Word 文档；扫描版 PDF 会使用云端 OCR 自动识别"
              rows={10}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              disabled={isBusy}
            />

            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={isBusy}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ${isBusy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                >
                  {extracting ? <SpinnerIcon /> : <UploadIcon />}
                  {extracting
                    ? extractStatus ?? "正在读取文档…"
                    : "选择文件"}
                </label>

                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={includeSimpleExplanation}
                    onChange={(e) =>
                      setIncludeSimpleExplanation(e.target.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    disabled={isBusy}
                  />
                  <span className="text-xs font-medium text-slate-600">
                    通俗解释
                  </span>
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  disabled={isBusy}
                  aria-label="输出语言"
                >
                  <option value="auto">自动检测</option>
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      正在分析…
                    </>
                  ) : (
                    <>
                      <SparkIcon />
                      开始总结
                    </>
                  )}
                </button>

                {text && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-slate-400 transition hover:text-slate-600"
                    disabled={isBusy}
                  >
                    清空
                  </button>
                )}

                {extractNotice && !extracting && (
                  <span className="text-xs text-emerald-600">{extractNotice}</span>
                )}

                <span className="ml-auto text-xs tabular-nums text-slate-400">
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  {charCount < MIN_CHARS && ` （至少 ${MIN_CHARS} 字）`}
                </span>
              </div>
            </div>
          </div>
        </div>
          </form>

          {error && (
            <div className="animate-fade-in-up rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div
          ref={resultsRef}
          className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto"
        >
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse-soft rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
                >
                  <div className="mb-3 h-4 w-32 rounded bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-5/6 rounded bg-slate-100" />
                    <div className="h-3 w-4/6 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !result && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">总结结果将显示在这里</p>
              <p className="mt-2 text-xs text-slate-400">
                左侧粘贴或上传内容，点击「开始总结」
              </p>
            </div>
          )}

          {result && !loading && (
            <>
              {activeEntry?.sourceExcerpt && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                  <span className="font-medium text-slate-700">原文摘要：</span>
                  {activeEntry.sourceExcerpt}
                </div>
              )}
              <ResultPanel
                result={result}
                initialLanguage={resultLanguage}
                purpose={getPurposeOption(purpose)}
                sourceContext={sourceContext}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
