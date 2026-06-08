import { SummarizerApp } from "@/components/SummarizerApp";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                StudySummarizer
              </h1>
              <p className="text-xs text-slate-500">AI 学习资料总结助手</p>
            </div>
          </div>
          <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 sm:inline-block">
            为学生设计
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            快速理解任何阅读材料
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
            粘贴文章或上传 PDF、Word、图片，AI 自动提取摘要、要点、关键词和通俗解释，并支持翻译后继续提问。
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <FeatureBadge>📖 阅读材料</FeatureBadge>
            <FeatureBadge>📝 课堂文章</FeatureBadge>
            <FeatureBadge>🔬 论文片段</FeatureBadge>
            <FeatureBadge>📄 PDF / Word</FeatureBadge>
            <FeatureBadge>🖼️ 图片 OCR</FeatureBadge>
          </div>
        </div>
      </section>

      {/* Main App */}
      <main>
        <SummarizerApp />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-400">
        <p>StudySummarizer — 让学习更高效</p>
      </footer>
    </div>
  );
}

function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 shadow-sm">
      {children}
    </span>
  );
}
