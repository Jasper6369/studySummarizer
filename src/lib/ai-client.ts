import OpenAI from "openai";

export type AIProvider = "deepseek" | "openai";

export function getAIProvider(): AIProvider {
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "deepseek";
}

export function getAIClient(): OpenAI {
  const provider = getAIProvider();

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPSEEK_API_KEY is not configured. Copy .env.example to .env.local and add your DeepSeek API key."
      );
    }

    return new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Copy .env.example to .env.local and add your API key."
    );
  }

  return new OpenAI({ apiKey });
}

export function getAIModel(): string {
  const provider = getAIProvider();

  if (provider === "deepseek") {
    return process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  }

  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}
