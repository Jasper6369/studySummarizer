"use client";

import { useEffect, useRef, useState } from "react";
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
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = getPurposeOption(value);

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.max(rect.width, 288);
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    const top = rect.bottom + 8;

    setMenuStyle({ top, left, width });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        role="listbox"
        aria-label="总结的目的"
        style={{
          top: menuStyle.top,
          left: menuStyle.left,
          width: menuStyle.width,
        }}
        className="fixed z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 px-3 py-2">
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
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            requestAnimationFrame(updateMenuPosition);
          }
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          open
            ? "border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <TargetIcon />
        <span>总结的目的</span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span className="hidden text-brand-700 sm:inline">
          {selected.icon} {selected.labelZh}
        </span>
        <ChevronIcon open={open} />
      </button>
      {menu}
    </>
  );
}

function TargetIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
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
