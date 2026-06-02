"use client";

import { useEffect, useState } from "react";

type ShareInfo = {
  localUrl: string;
  shareUrls: string[];
  note: string;
};

export function SharePanel() {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/share-url")
      .then((res) => res.json())
      .then((data) => setInfo(data as ShareInfo))
      .catch(() => null);
  }, []);

  if (!info || info.shareUrls.length === 0) return null;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-6 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">📢 分享给同学？</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          {info.note}
        </p>
        <ul className="mt-2 space-y-1.5">
          {info.shareUrls.map((url) => (
            <li key={url} className="flex flex-wrap items-center gap-2">
              <a
                href={url}
                className="font-mono text-xs text-brand-700 underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {url}
              </a>
              <button
                type="button"
                onClick={() => copy(url)}
                className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-100"
              >
                {copied === url ? "已复制" : "复制"}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-amber-700/80">
          你的电脑需保持运行 <code className="rounded bg-white/60 px-1">npm run dev</code>
          ，且对方与你在同一 WiFi。
        </p>
      </div>
    </div>
  );
}
