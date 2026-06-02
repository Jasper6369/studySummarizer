import { getAIClient, getAIModel } from "./ai-client";
import {
  SummarizeResponseSchema,
  type SummarizeResponse,
} from "./types";

export async function translateSummary(
  result: SummarizeResponse,
  targetLanguage: "zh" | "en"
): Promise<SummarizeResponse> {
  const client = getAIClient();
  const model = getAIModel();

  const targetLabel =
    targetLanguage === "zh" ? "Simplified Chinese" : "English";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the given study summary JSON into ${targetLabel}.

Return ONLY valid JSON with the exact same structure:
{
  "summary": "...",
  "bulletPoints": ["...", ...],
  "keywords": ["...", ...]${result.simpleExplanation ? ',\n  "simpleExplanation": "..."' : ""}
}

Rules:
- Preserve meaning accurately; do not add or remove information.
- Keep the same number of bullet points and keywords.
- Use natural, student-friendly language.
- Do not wrap JSON in markdown code fences.`,
      },
      {
        role: "user",
        content: JSON.stringify(result),
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
    throw new Error("Failed to parse translation response.");
  }

  const validated = SummarizeResponseSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("Translation response did not match expected format.");
  }

  return validated.data;
}
