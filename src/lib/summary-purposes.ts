import { z } from "zod";

export const SummaryPurposeSchema = z.enum([
  "quick_understanding",
  "class_discussion",
  "writing_essay",
  "presentation",
  "review",
]);

export type SummaryPurpose = z.infer<typeof SummaryPurposeSchema>;

export type PurposeOption = {
  id: SummaryPurpose;
  labelEn: string;
  labelZh: string;
  icon: string;
  description: string;
};

export const SUMMARY_PURPOSES: PurposeOption[] = [
  {
    id: "quick_understanding",
    labelEn: "For quick understanding",
    labelZh: "快速理解",
    icon: "⚡",
    description: "抓住核心意思，省时省力",
  },
  {
    id: "class_discussion",
    labelEn: "For class discussion",
    labelZh: "课堂讨论",
    icon: "💬",
    description: "观点、争议点、可讨论的问题",
  },
  {
    id: "writing_essay",
    labelEn: "For writing essay",
    labelZh: "写论文用",
    icon: "📝",
    description: "论点、论据、可引用的表述",
  },
  {
    id: "presentation",
    labelEn: "For presentation",
    labelZh: "做展示用",
    icon: "🎤",
    description: "结构清晰、适合口头讲解",
  },
  {
    id: "review",
    labelEn: "For review",
    labelZh: "复习用",
    icon: "📚",
    description: "考点、记忆要点、知识框架",
  },
];

export function getPurposeOption(id: SummaryPurpose): PurposeOption {
  return (
    SUMMARY_PURPOSES.find((p) => p.id === id) ?? SUMMARY_PURPOSES[0]
  );
}

export function getPurposePromptInstruction(purpose: SummaryPurpose): string {
  switch (purpose) {
    case "quick_understanding":
      return `The student wants a QUICK UNDERSTANDING summary. Tailor all output for speed and clarity:
- summary: Focus on the main idea and "so what" in plain language. Avoid academic fluff.
- bulletPoints: 4-6 essential takeaways only. Each should answer "what do I need to know?"
- keywords: Core concepts only (5-8).
- simpleExplanation (if included): Extra plain-language walkthrough for a beginner.`;

    case "class_discussion":
      return `The student is preparing for CLASS DISCUSSION. Tailor all output for participation:
- summary: Highlight the author's main argument, stance, and context (2-4 sentences).
- bulletPoints: Include debatable claims, supporting evidence, counterarguments, and 2-3 discussion questions they could raise in class.
- keywords: Terms and names useful for discussion.
- simpleExplanation (if included): Explain why this topic matters and what different viewpoints exist.`;

    case "writing_essay":
      return `The student is preparing to WRITE AN ESSAY. Tailor all output for academic writing:
- summary: Thesis-level overview: central claim, scope, and logical flow (3-5 sentences).
- bulletPoints: Thesis angles, key evidence, definitions, cause-effect links, and quotable paraphrasable points (not verbatim quotes unless short).
- keywords: Academic vocabulary and theorists/concepts for citations.
- simpleExplanation (if included): How to use this material in an essay introduction or body paragraph.`;

    case "presentation":
      return `The student is preparing a PRESENTATION. Tailor all output for speaking slides:
- summary: Opening hook + main message + closing takeaway (structured for slides).
- bulletPoints: Slide-friendly points (short phrases OK). Include suggested flow: intro → key points → conclusion. 5-8 items max.
- keywords: Terms to define on a slide.
- simpleExplanation (if included): One-paragraph "how to explain this to an audience" script.`;

    case "review":
      return `The student is REVIEWING for exams or study. Tailor all output for retention:
- summary: Condensed recap of what to remember (3-5 sentences).
- bulletPoints: Exam-style facts, definitions, formulas, dates, comparisons, and "remember this" items. Use clear, testable statements.
- keywords: Must-know terms for flashcards (6-10).
- simpleExplanation (if included): Memory aids, analogies, and how concepts connect in a study map.`;

    default:
      return getPurposePromptInstruction("quick_understanding");
  }
}
