// Client-side PDF text extraction using pdfjs-dist.
import * as pdfjsLib from "pdfjs-dist";
// Bundled worker URL (Vite handles ?url).
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractedPdf {
  pdfName: string;
  totalPages: number;
  content: string;
}

export async function extractPdfText(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ExtractedPdf> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const pageText = tc.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    parts.push(`\n\n--- Page ${i} ---\n${pageText}`);
    onProgress?.(Math.round((i / total) * 100));
  }

  return {
    pdfName: file.name,
    totalPages: total,
    content: parts.join("\n").trim(),
  };
}
