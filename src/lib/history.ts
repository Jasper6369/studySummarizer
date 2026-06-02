import type { SummaryPurpose } from "@/lib/summary-purposes";
import type { DisplayLanguage, SummarizeResponse } from "@/lib/types";

export type HistoryEntry = {
  id: string;
  createdAt: string;
  title: string;
  fileName: string | null;
  purpose: SummaryPurpose;
  resultLanguage: DisplayLanguage;
  result: SummarizeResponse;
  sourceExcerpt: string;
};

const STORAGE_KEY = "studysummarizer-history";
const MAX_ENTRIES = 30;
const EXCERPT_LENGTH = 200;

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildTitle(text: string, fileName: string | null): string {
  if (fileName) {
    return fileName.replace(/\.[^.]+$/, "");
  }

  const line = text.trim().split(/\n/)[0] ?? "";
  if (line.length <= 48) return line || "未命名总结";
  return `${line.slice(0, 48)}…`;
}

function buildExcerpt(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= EXCERPT_LENGTH) return normalized;
  return `${normalized.slice(0, EXCERPT_LENGTH)}…`;
}

export function createHistoryEntry(input: {
  text: string;
  fileName: string | null;
  purpose: SummaryPurpose;
  resultLanguage: DisplayLanguage;
  result: SummarizeResponse;
}): HistoryEntry {
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    title: buildTitle(input.text, input.fileName),
    fileName: input.fileName,
    purpose: input.purpose,
    resultLanguage: input.resultLanguage,
    result: input.result,
    sourceExcerpt: buildExcerpt(input.text),
  };
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          entry?.id &&
          entry?.createdAt &&
          entry?.result?.summary &&
          Array.isArray(entry.result.bulletPoints)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch {
    return [];
  }
}

function persistHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const entries = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  persistHistory(entries);
  return entries;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const entries = loadHistory().filter((entry) => entry.id !== id);
  persistHistory(entries);
  return entries;
}

export function clearHistory(): HistoryEntry[] {
  persistHistory([]);
  return [];
}

export function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
