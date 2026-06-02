import { getAIClient, getAIModel } from "./ai-client";
import {
  getPurposeOption,
  getPurposePromptInstruction,
  type SummaryPurpose,
} from "./summary-purposes";
import { SummarizeResponseSchema, type SummarizeResponse } from "./types";

function buildSystemPrompt(
  includeSimpleExplanation: boolean,
  language: "auto" | "zh" | "en",
  purpose: SummaryPurpose
): string {
  const languageInstruction =
    language === "zh"
      ? "Respond entirely in Simplified Chinese."
      : language === "en"
        ? "Respond entirely in English."
        : "Respond in the same language as the input text. If mixed, prefer the dominant language.";

  const simpleExplanationRule = includeSimpleExplanation
    ? `- simpleExplanation: Follow the purpose-specific guidance below for this field.`
    : `- Do NOT include simpleExplanation in the JSON output.`;

  const purposeInstruction = getPurposePromptInstruction(purpose);
  const purposeMeta = getPurposeOption(purpose);

  return `You are a helpful study assistant for students. Your job is to analyze reading materials and produce a summary TAILORED to the student's specific learning goal.

STUDENT'S PURPOSE: ${purposeMeta.labelEn} / ${purposeMeta.labelZh}

${purposeInstruction}

${languageInstruction}

Return ONLY valid JSON with this exact structure:
{
  "summary": "...",
  "bulletPoints": ["...", ...],
  "keywords": ["...", ...]${includeSimpleExplanation ? ',\n  "simpleExplanation": "..."' : ""}
}

General rules:
- All sections must align with the student's purpose above — do not produce a generic summary.
- Do not invent facts not present in the source text.
- Do not wrap JSON in markdown code fences.
${simpleExplanationRule}`;
}

export async function summarizeText(
  text: string,
  options: {
    includeSimpleExplanation: boolean;
    language: "auto" | "zh" | "en";
    purpose: SummaryPurpose;
  }
): Promise<SummarizeResponse> {
  const client = getAIClient();
  const model = getAIModel();
  const purposeMeta = getPurposeOption(options.purpose);

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(
          options.includeSimpleExplanation,
          options.language,
          options.purpose
        ),
      },
      {
        role: "user",
        content: `Summarize the following text for: ${purposeMeta.labelEn} (${purposeMeta.labelZh}).\n\n${text}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response received from AI model.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI response as JSON.");
  }

  const result = SummarizeResponseSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("AI response did not match expected format.");
  }

  return result.data;
}
