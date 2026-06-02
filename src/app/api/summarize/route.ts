import { NextResponse } from "next/server";
import { summarizeText } from "@/lib/summarize";
import { SummarizeRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SummarizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { text, includeSimpleExplanation, language, purpose } = parsed.data;

    const result = await summarizeText(text, {
      includeSimpleExplanation,
      language,
      purpose,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    const status =
      message.includes("API_KEY is not configured") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
