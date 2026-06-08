"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelRect, setPanelRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = getPurposeOption(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelRect = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12
    );
    const estimatedHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    const top = openUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8;

    setPanelRect({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelRect();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handleReposition = () => updatePanelRect();

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const panel =
    mounted &&
    open &&
    panelRect &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[9998] bg-black/10"
          aria-hidden
          onClick={() => setOpen(false)}
        />
        <div
          ref={panelRef}
          role="listbox"
          aria-label="总结的目的"
          style={{
            top: panelRect.top,
            left: panelRect.left,
            width: panelRect.width,
          }}
          className="fixed z-[9999] max-h-[min(360px,calc(100vh-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-900">
              我总结这篇文章是为了什么？
            </p>
            <p className="text-[11px] text-slate-500">
              选择后 AI 会生成针对性的总结
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto p-1.5">
            {SUMMARY_PURPOSES.map((purpose) => {
              const isSelected = value === purpose.id;

              return (
                <li key={purpose.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(purpose.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                      isSelected
                        ? "bg-brand-50 text-brand-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {purpose.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{purpose.labelZh}</p>
                      <p className="text-[11px] text-slate-400">
                        {purpose.labelEn}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        {purpose.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="mt-0.5 text-xs text-brand-600">✓</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </>,
      document.body
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          open
            ? "border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span>总结的目的</span>
        <span className="text-slate-300">·</span>
        <span className="text-brand-700">
          {selected.icon} {selected.labelZh}
        </span>
        <ChevronIcon open={open} />
      </button>
      {panel}
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
