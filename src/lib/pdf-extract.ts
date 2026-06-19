// Client-side PDF text extraction using pdfjs-dist.
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface PdfPage {
  page: number;
  text: string;
}

export interface ExtractedPdf {
  pdfName: string;
  totalPages: number;
  content: string;
  pages: PdfPage[];
}

export async function extractPdfText(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ExtractedPdf> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = pdf.numPages;
  const pages: PdfPage[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const pageText = tc.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: i, text: pageText });
    onProgress?.(Math.round((i / total) * 100));
  }

  const content = pages
    .map((p) => `\n\n--- Page ${p.page} ---\n${p.text}`)
    .join("\n")
    .trim();

  return { pdfName: file.name, totalPages: total, content, pages };
}
