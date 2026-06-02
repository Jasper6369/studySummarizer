import { NextResponse } from "next/server";
import { translateSummary } from "@/lib/translate";
import { TranslateRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = TranslateRequestSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { result, targetLanguage } = parsed.data;

    const translated = await translateSummary(result, targetLanguage);

    return NextResponse.json(translated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "翻译失败，请稍后重试。";

    const status =
      message.includes("API_KEY is not configured") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
