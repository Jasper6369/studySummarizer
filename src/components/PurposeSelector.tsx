"use client";

import {
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
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          我总结这篇文章是为了什么？
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          选择目的后，AI 会生成针对性的总结内容
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_PURPOSES.map((purpose) => {
          const selected = value === purpose.id;

          return (
            <button
              key={purpose.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(purpose.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                  : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none" aria-hidden>
                  {purpose.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      selected ? "text-brand-800" : "text-slate-900"
                    }`}
                  >
                    {purpose.labelZh}
                  </p>
                  <p className="text-xs text-slate-400">{purpose.labelEn}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {purpose.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
