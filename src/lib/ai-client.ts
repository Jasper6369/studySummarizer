import OpenAI from "openai";

export type AIProvider = "deepseek" | "openai";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function configError(name: string): Error {
  const isProduction = Boolean(process.env.VERCEL);

  if (isProduction) {
    return new Error(
      "服务端 AI 功能尚未配置，请联系网站管理员在 Vercel 中设置环境变量后重新部署。"
    );
  }

  return new Error(
    `${name} 未配置。请复制 .env.example 为 .env.local 并填入 API Key。`
  );
}

export function getAIProvider(): AIProvider {
  if (readEnv("DEEPSEEK_API_KEY")) return "deepseek";
  if (readEnv("OPENAI_API_KEY")) return "openai";
  return "deepseek";
}

export function getAIClient(): OpenAI {
  const provider = getAIProvider();

  if (provider === "deepseek") {
    const apiKey = readEnv("DEEPSEEK_API_KEY");
    if (!apiKey) {
      throw configError("DEEPSEEK_API_KEY");
    }

    return new OpenAI({
      apiKey,
      baseURL: readEnv("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com",
    });
  }

  const apiKey = readEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw configError("OPENAI_API_KEY");
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
