import { getAIClient, getAIModel } from "./ai-client";
import type { ChatMessage, DisplayLanguage, SummarizeResponse } from "./types";

function buildContextBlock(
  sourceContext: string,
  summary: SummarizeResponse
): string {
  const parts = [
    "## Source excerpt",
    sourceContext.trim() || "(No source text available)",
    "",
    "## Summary",
    summary.summary,
    "",
    "## Bullet points",
    summary.bulletPoints.map((point) => `- ${point}`).join("\n"),
    "",
    "## Keywords",
    summary.keywords.join(", "),
  ];

  if (summary.simpleExplanation) {
    parts.push("", "## Simple explanation", summary.simpleExplanation);
  }

  return parts.join("\n");
}

export async function answerSummaryQuestion(options: {
  question: string;
  history: ChatMessage[];
  sourceContext: string;
  summary: SummarizeResponse;
  language: DisplayLanguage;
}): Promise<string> {
  const client = getAIClient();
  const model = getAIModel();
  const languageInstruction =
    options.language === "zh"
      ? "Respond entirely in Simplified Chinese."
      : "Respond entirely in English.";

  const contextBlock = buildContextBlock(
    options.sourceContext,
    options.summary
  );

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You are a helpful study assistant. The student has read a document and received an AI summary. Answer follow-up questions based ONLY on the provided source excerpt and summary.

Rules:
- Be concise, clear, and student-friendly.
- If the answer is not in the provided material, say so honestly.
- Do not invent facts.
- ${languageInstruction}`,
      },
      {
        role: "user",
        content: `Study material context:\n\n${contextBlock}`,
      },
      ...options.history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: options.question,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("No response received from AI model.");
  }

  return content;
}
