import { NextResponse } from "next/server";
import {
  extractTextFromFile,
  getFileExtension,
  isSupportedExtension,
  MAX_FILE_SIZE,
} from "@/lib/extract-text";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "请上传文件。" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 4MB。" },
        { status: 400 }
      );
    }

    const ext = getFileExtension(file.name);
    if (!isSupportedExtension(ext)) {
      return NextResponse.json(
        { error: "不支持的文件格式。" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractTextFromFile(buffer, file.name);

    return NextResponse.json({
      text: result.text,
      fileName: file.name,
      charCount: result.text.length,
      method: result.method,
      pagesProcessed: result.pagesProcessed,
      totalPages: result.totalPages,
      truncated: result.truncated,
      message:
        result.method === "ocr"
          ? result.truncated
            ? `已通过云端 OCR 识别前 ${result.pagesProcessed} 页（文档共 ${result.totalPages} 页）`
            : `已通过云端 OCR 识别扫描版 PDF，共 ${result.pagesProcessed} 页`
          : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "文档读取失败，请稍后重试。";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
