import {
  ocrImageBuffersSequential,
  ocrPdfBuffer,
} from "./cloud-ocr";

const MIN_EXTRACTED_CHARS = 50;
const MIN_CHARS_PER_PAGE = 30;
export const MAX_OCR_PAGES = 15;
const PDF_CLOUD_OCR_MAX_BYTES = 5 * 1024 * 1024;

/** Vercel 等云端环境不使用 pdf-to-img（依赖本地 canvas，会失败） */
const preferCloudPdfOcr =
  !!process.env.VERCEL || process.env.OCR_PDF_MODE === "cloud";

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function shouldUseOcr(text: string, pageCount: number): boolean {
  const normalized = normalizeText(text);

  if (normalized.length < MIN_EXTRACTED_CHARS) {
    return true;
  }

  if (pageCount > 0 && normalized.length / pageCount < MIN_CHARS_PER_PAGE) {
    return true;
  }

  return false;
}

async function ocrPdfViaCloud(
  buffer: Buffer,
  totalPagesHint?: number
): Promise<{
  text: string;
  pagesProcessed: number;
  totalPages: number;
}> {
  const text = normalizeText(await ocrPdfBuffer(buffer));

  if (text.length < MIN_EXTRACTED_CHARS) {
    throw new Error(
      "云端 OCR 未能识别到足够文字。请确认 PDF 扫描清晰，或尝试更小的文件。"
    );
  }

  return {
    text,
    pagesProcessed: totalPagesHint ?? 1,
    totalPages: totalPagesHint ?? 1,
  };
}

async function ocrPdfViaLocalPages(
  buffer: Buffer,
  totalPagesHint?: number
): Promise<{
  text: string;
  pagesProcessed: number;
  totalPages: number;
}> {
  const { pdf } = await import("pdf-to-img");
  const pageBuffers: Buffer[] = [];
  const document = await pdf(buffer, { scale: 1.0 });

  for await (const page of document) {
    pageBuffers.push(Buffer.from(page));
    if (pageBuffers.length >= MAX_OCR_PAGES) break;
  }

  if (pageBuffers.length === 0) {
    throw new Error("无法读取 PDF 页面，请确认文件未损坏。");
  }

  const pageTexts = await ocrImageBuffersSequential(pageBuffers);
  const combined = normalizeText(
    pageTexts.filter((t) => t.trim()).join("\n\n")
  );

  if (combined.length < MIN_EXTRACTED_CHARS) {
    throw new Error("云端 OCR 未能识别到足够文字。");
  }

  return {
    text: combined,
    pagesProcessed: pageBuffers.length,
    totalPages: totalPagesHint ?? pageBuffers.length,
  };
}

export async function ocrPdfText(
  buffer: Buffer,
  totalPagesHint?: number
): Promise<{
  text: string;
  pagesProcessed: number;
  totalPages: number;
}> {
  if (preferCloudPdfOcr || buffer.length <= PDF_CLOUD_OCR_MAX_BYTES) {
    try {
      return await ocrPdfViaCloud(buffer, totalPagesHint);
    } catch (error) {
      if (preferCloudPdfOcr) {
        throw error;
      }
    }
  }

  return ocrPdfViaLocalPages(buffer, totalPagesHint);
}

export async function extractPdfTextWithOcr(buffer: Buffer): Promise<{
  text: string;
  method: "text" | "ocr";
  pagesProcessed?: number;
  totalPages?: number;
  truncated?: boolean;
}> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const embeddedText = data.text ?? "";
  const pageCount = data.numpages ?? 1;

  if (!shouldUseOcr(embeddedText, pageCount)) {
    return {
      text: normalizeText(embeddedText),
      method: "text",
    };
  }

  const ocrResult = await ocrPdfText(buffer, pageCount);

  return {
    text: ocrResult.text,
    method: "ocr",
    pagesProcessed: ocrResult.pagesProcessed,
    totalPages: pageCount,
    truncated: pageCount > MAX_OCR_PAGES,
  };
}
