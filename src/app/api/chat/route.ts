import { NextResponse } from "next/server";
import { answerSummaryQuestion } from "@/lib/chat";
import { ChatRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { question, history, sourceContext, summary, language } = parsed.data;

    const answer = await answerSummaryQuestion({
      question,
      history,
      sourceContext,
      summary,
      language,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    const status =
      message.includes("未配置") ||
      message.includes("尚未配置") ||
      message.includes("API_KEY is not configured")
        ? 503
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
