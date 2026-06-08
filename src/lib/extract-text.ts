import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { ocrImageFile } from "./cloud-ocr";
import { extractPdfTextWithOcr } from "./pdf-ocr";

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown"];
const BINARY_EXTENSIONS = [".pdf", ".doc", ".docx"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

export const SUPPORTED_EXTENSIONS = [
  ...TEXT_EXTENSIONS,
  ...BINARY_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
];

/** Vercel 请求体上限约 4.5MB */
export const MAX_FILE_SIZE = process.env.VERCEL
  ? 4 * 1024 * 1024
  : 10 * 1024 * 1024;
export const MAX_OUTPUT_CHARS = 50000;

export type ExtractionResult = {
  text: string;
  method?: "text" | "ocr";
  pagesProcessed?: number;
  totalPages?: number;
  truncated?: boolean;
};

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return "." + parts.pop()!.toLowerCase();
}

export function isSupportedExtension(ext: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function isBinaryDocument(ext: string): boolean {
  return BINARY_EXTENSIONS.includes(ext) || IMAGE_EXTENSIONS.includes(ext);
}

export function isImageExtension(ext: string): boolean {
  return IMAGE_EXTENSIONS.includes(ext);
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractDocText(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return doc.getBody() ?? "";
}

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const ext = getFileExtension(filename);

  if (!isSupportedExtension(ext)) {
    throw new Error(
      `不支持的文件格式。请上传 ${SUPPORTED_EXTENSIONS.join("、")} 文件。`
    );
  }

  let result: ExtractionResult;

  switch (ext) {
    case ".txt":
    case ".md":
    case ".markdown":
      result = { text: buffer.toString("utf-8"), method: "text" };
      break;
    case ".pdf":
      result = await extractPdfTextWithOcr(buffer);
      break;
    case ".docx":
      result = { text: await extractDocxText(buffer), method: "text" };
      break;
    case ".doc":
      result = { text: await extractDocText(buffer), method: "text" };
      break;
    case ".jpg":
    case ".jpeg":
    case ".png":
    case ".webp":
    case ".gif":
    case ".bmp":
      result = { text: await ocrImageFile(buffer, ext), method: "ocr" };
      break;
    default:
      throw new Error("不支持的文件格式。");
  }

  const text = normalizeText(result.text);

  if (text.length < 50) {
    throw new Error(
      "未能从文档中提取到足够文字。请确认文件内容清晰可读。"
    );
  }

  return {
    ...result,
    text: text.slice(0, MAX_OUTPUT_CHARS),
  };
}
