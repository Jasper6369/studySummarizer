"use client";

import { useState } from "react";
import {
  formatHistoryDate,
  type HistoryEntry,
} from "@/lib/history";
import { getPurposeOption } from "@/lib/summary-purposes";

type HistoryPanelProps = {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

export function HistoryPanel({
  entries,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}: HistoryPanelProps) {
  const [expanded, setExpanded] = useState(entries.length > 0);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-5 py-4 text-sm text-slate-500">
        暂无历史记录。生成总结后会自动保存在本浏览器中。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80 sm:px-6"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">历史记录</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            保存在本浏览器，最多 {entries.length} 条最近总结
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            {entries.length}
          </span>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {entries.map((entry) => {
              const purpose = getPurposeOption(entry.purpose);
              const selected = entry.id === activeId;

              return (
                <li key={entry.id}>
                  <div
                    className={`flex items-start gap-3 px-5 py-3 transition sm:px-6 ${
                      selected ? "bg-brand-50/70" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(entry)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {entry.title}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {purpose.icon} {purpose.labelZh}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {entry.result.summary}
                      </p>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        {formatHistoryDate(entry.createdAt)}
                        {entry.fileName ? ` · ${entry.fileName}` : ""}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="删除这条历史记录"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-slate-100 px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-slate-500 transition hover:text-red-600"
            >
              清空全部历史
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
