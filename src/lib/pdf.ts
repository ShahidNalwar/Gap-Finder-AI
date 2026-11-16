import "server-only";

import type { TextPage } from "@/lib/retrieval/chunk";
import { AppError } from "@/lib/api";

export async function extractPdf(data: Uint8Array): Promise<TextPage[]> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data });
    try {
      const result = await parser.getText();
      return result.pages.map((page) => ({ page: page.num, text: page.text }));
    } finally {
      await parser.destroy();
    }
  } catch {
    throw new AppError("Couldn't read this PDF. Try an unencrypted PDF with selectable text, or upload a .txt file.");
  }
}
