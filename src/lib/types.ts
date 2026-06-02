import { z } from "zod";
import { SummaryPurposeSchema } from "./summary-purposes";

export { SummaryPurposeSchema };
export type { SummaryPurpose } from "./summary-purposes";

export const SummarizeRequestSchema = z.object({
  text: z.string().min(50, "Text must be at least 50 characters").max(50000),
  includeSimpleExplanation: z.boolean().default(true),
  language: z.enum(["auto", "zh", "en"]).default("auto"),
  purpose: SummaryPurposeSchema.default("quick_understanding"),
});

export const SummarizeResponseSchema = z.object({
  summary: z.string(),
  bulletPoints: z.array(z.string()).min(1),
  keywords: z.array(z.string()).min(1),
  simpleExplanation: z.string().optional(),
});

export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;
export type SummarizeResponse = z.infer<typeof SummarizeResponseSchema>;

export const TranslateRequestSchema = z.object({
  result: SummarizeResponseSchema,
  targetLanguage: z.enum(["zh", "en"]),
});

export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export type DisplayLanguage = "zh" | "en";

export type ApiError = {
  error: string;
};
