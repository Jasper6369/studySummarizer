"use client";

import { useState } from "react";
import {
  getPurposeOption,
  SUMMARY_PURPOSES,
  type SummaryPurpose,
} from "@/lib/summary-purposes";

type PurposeSelectorProps = {
  value: SummaryPurpose;
  onChange: (purpose: SummaryPurpose) => void;
  disabled?: boolean;
};

export function PurposeSelector({
  value,
  onChange,
  disabled,
}: PurposeSelectorProps) {
  const [open, setOpen] = useState(true);
  const selected = getPurposeOption(value);

  return (
    <div className="border-b border-slate-100 bg-slate-50/60">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-slate-50 sm:px-6"
      >
        <div>
          <p className="text-xs font-semibold text-slate-900">总结的目的</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            当前：{selected.icon} {selected.labelZh}
          </p>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3 sm:px-6">
          <p className="mb-2 text-[11px] text-slate-500">
            我总结这篇文章是为了什么？
          </p>
          <div
            role="listbox"
            aria-label="总结的目的"
            className="grid gap-2 sm:grid-cols-2"
          >
            {SUMMARY_PURPOSES.map((purpose) => {
              const isSelected = value === purpose.id;

              return (
                <button
                  key={purpose.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onClick={() => onChange(purpose.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                      : "border-slate-200 bg-white hover:border-brand-200"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none" aria-hidden>
                      {purpose.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isSelected ? "text-brand-800" : "text-slate-900"
                        }`}
                      >
                        {purpose.labelZh}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {purpose.labelEn}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        {purpose.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
