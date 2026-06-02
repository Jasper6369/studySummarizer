const OCR_SPACE_API_URL = "https://api.ocr.space/parse/image";
const MAX_IMAGE_BYTES = 900 * 1024;

type OcrSpaceResponse = {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  ParsedResults?: Array<{ ParsedText?: string; ErrorMessage?: string }>;
};

function getOcrSpaceApiKey(): string {
  const key = process.env.OCR_SPACE_API_KEY?.trim();

  if (!key || key.includes("your-ocr-space-key")) {
    throw new Error(
      "OCR_SPACE_API_KEY 未配置。请在 .env.local 中添加 Key（免费获取：https://ocr.space/ocrapi/freekey）"
    );
  }

  return key;
}

function getOcrLanguage(): string {
  return process.env.OCR_LANGUAGE?.trim() || "auto";
}

function extractParsedText(result: OcrSpaceResponse): string {
  return (result.ParsedResults ?? [])
    .map((item) => item.ParsedText?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function getErrorMessage(result: OcrSpaceResponse, status?: number): string {
  const pageErrors = (result.ParsedResults ?? [])
    .map((item) => item.ErrorMessage?.trim())
    .filter(Boolean);

  if (pageErrors.length > 0) {
    return pageErrors.join(" ");
  }

  if (Array.isArray(result.ErrorMessage)) {
    return result.ErrorMessage.join(" ");
  }

  if (result.ErrorMessage) {
    return result.ErrorMessage;
  }

  if (result.ErrorDetails) {
    return result.ErrorDetails;
  }

  if (status && status !== 200) {
    return `OCR 服务返回 HTTP ${status}，请检查 API Key 或稍后重试。`;
  }

  if (result.OCRExitCode === 3) {
    return "OCR 服务暂时不可用，请稍后重试。";
  }

  if (result.OCRExitCode === 4) {
    return "OCR 识别超时，请尝试页数更少或文件更小的 PDF。";
  }

  return `OCR 识别失败（exitCode: ${result.OCRExitCode ?? "unknown"}），请确认 API Key 有效且文件小于 1MB/页。`;
}

async function parseOcrResponse(response: Response): Promise<OcrSpaceResponse> {
  const rawText = await response.text();

  try {
    return JSON.parse(rawText) as OcrSpaceResponse;
  } catch {
    throw new Error(
      `OCR 服务返回异常（HTTP ${response.status}），请检查网络连接。`
    );
  }
}

async function callOcrSpace(formData: FormData): Promise<string> {
  const apiKey = getOcrSpaceApiKey();

  const response = await fetch(OCR_SPACE_API_URL, {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
    body: formData,
  });

  const result = await parseOcrResponse(response);
  const parsedText = extractParsedText(result);

  if (
    parsedText.length > 0 &&
    (result.OCRExitCode === 1 || result.OCRExitCode === 2)
  ) {
    return parsedText;
  }

  if (result.IsErroredOnProcessing || !response.ok) {
    throw new Error(getErrorMessage(result, response.status));
  }

  if (parsedText.length > 0) {
    return parsedText;
  }

  throw new Error(getErrorMessage(result, response.status));
}

function buildImageFormData(imageBuffer: Buffer): FormData {
  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error(
      `PDF 页面图片过大（${Math.round(imageBuffer.length / 1024)}KB），OCR.space 免费版单页限制 1MB。请上传页数更少或分辨率更低的 PDF。`
    );
  }

  const formData = new FormData();
  formData.append("apikey", getOcrSpaceApiKey());
  formData.append(
    "base64Image",
    `data:image/png;base64,${imageBuffer.toString("base64")}`
  );
  formData.append("language", getOcrLanguage());
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");
  formData.append("filetype", "PNG");
  formData.append("detectOrientation", "true");

  return formData;
}

export async function ocrImageBuffer(imageBuffer: Buffer): Promise<string> {
  return callOcrSpace(buildImageFormData(imageBuffer));
}

export async function ocrPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  if (pdfBuffer.length > MAX_IMAGE_BYTES * 10) {
    throw new Error("PDF 文件过大，请上传小于 5MB 的文件。");
  }

  const formData = new FormData();
  formData.append("apikey", getOcrSpaceApiKey());
  formData.append(
    "base64Image",
    `data:application/pdf;base64,${pdfBuffer.toString("base64")}`
  );
  formData.append("language", getOcrLanguage());
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");
  formData.append("filetype", "PDF");
  formData.append("detectOrientation", "true");

  return callOcrSpace(formData);
}

export async function ocrImageBuffersSequential(
  imageBuffers: Buffer[]
): Promise<string[]> {
  const results: string[] = [];

  for (const [index, buffer] of imageBuffers.entries()) {
    try {
      const text = await ocrImageBuffer(buffer);
      results.push(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OCR 识别失败";
      throw new Error(`第 ${index + 1} 页 OCR 失败：${message}`);
    }

    if (index < imageBuffers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  return results;
}
