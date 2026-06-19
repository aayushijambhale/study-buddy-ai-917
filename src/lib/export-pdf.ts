import { jsPDF } from "jspdf";
import type { QuizData, SavedExplanation } from "@/context/StudyContext";

interface Args {
  pdfName: string;
  notes?: string;
  quiz?: QuizData | null;
  explanations?: SavedExplanation[];
}

const PAGE_MARGIN = 48;
const LINE_GAP = 4;

export function exportStudyReport({ pdfName, notes, quiz, explanations }: Args) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensureSpace = (lines = 1, size = 11) => {
    if (y + lines * (size + LINE_GAP) > pageH - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const writeText = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) => {
    const size = opts.size ?? 11;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    if (opts.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(20, 78, 74); // teal-900-ish
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensureSpace(1, size);
      doc.text(line, PAGE_MARGIN, y);
      y += size + LINE_GAP;
    }
    y += opts.gap ?? 4;
  };

  const hr = () => {
    ensureSpace(1);
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(0.6);
    doc.line(PAGE_MARGIN, y, pageW - PAGE_MARGIN, y);
    y += 14;
  };

  // Header
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 251, 245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AI Study Buddy — Study Report", PAGE_MARGIN, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Source: ${pdfName}`, PAGE_MARGIN, 56);
  doc.text(new Date().toLocaleString(), pageW - PAGE_MARGIN, 56, { align: "right" });
  y = 100;

  // Strip markdown markers for legibility
  const cleanMd = (s: string) =>
    s
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/^\d+\.\s+/gm, (m) => m)
      .replace(/\n{3,}/g, "\n\n");

  if (notes && notes.trim()) {
    writeText("Smart Notes", { size: 16, bold: true, gap: 6 });
    hr();
    for (const block of cleanMd(notes).split(/\n{2,}/)) {
      writeText(block, { size: 11, gap: 8 });
    }
  }

  if (quiz) {
    doc.addPage();
    y = PAGE_MARGIN;
    writeText("Quiz", { size: 16, bold: true, gap: 6 });
    hr();

    if (quiz.mcq.length) {
      writeText("Multiple Choice", { size: 13, bold: true, gap: 4 });
      quiz.mcq.forEach((q, i) => {
        writeText(`${i + 1}. ${q.question}`, { bold: true });
        q.options.forEach((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          writeText(`   ${letter}. ${opt}`);
        });
        writeText(
          `   Answer: ${q.answer}${q.sourcePage ? `  (p.${q.sourcePage})` : ""}`,
          { color: [15, 118, 110], bold: true },
        );
        if (q.explanation) writeText(`   ${q.explanation}`, { color: [80, 80, 80] });
        y += 4;
      });
    }

    if (quiz.trueFalse.length) {
      ensureSpace(3);
      writeText("True / False", { size: 13, bold: true, gap: 4 });
      quiz.trueFalse.forEach((q, i) => {
        writeText(`${i + 1}. ${q.question}`, { bold: true });
        writeText(
          `   Answer: ${q.answer}${q.sourcePage ? `  (p.${q.sourcePage})` : ""}`,
          { color: [15, 118, 110], bold: true },
        );
        if (q.explanation) writeText(`   ${q.explanation}`, { color: [80, 80, 80] });
      });
    }

    if (quiz.short.length) {
      ensureSpace(3);
      writeText("Short Answer", { size: 13, bold: true, gap: 4 });
      quiz.short.forEach((q, i) => {
        writeText(`${i + 1}. ${q.question}`, { bold: true });
        writeText(`   ${q.answer}${q.sourcePage ? `  (p.${q.sourcePage})` : ""}`, {
          color: [15, 118, 110],
        });
      });
    }
  }

  if (explanations && explanations.length) {
    doc.addPage();
    y = PAGE_MARGIN;
    writeText("Saved Explanations", { size: 16, bold: true, gap: 6 });
    hr();
    explanations.forEach((e, i) => {
      writeText(`${i + 1}. Original`, { bold: true, size: 12 });
      writeText(cleanMd(e.source), { color: [80, 80, 80] });
      writeText("Simpler version", { bold: true, size: 12 });
      writeText(cleanMd(e.explanation));
      y += 6;
    });
  }

  // Footer page numbers
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${p} of ${total}`, pageW - PAGE_MARGIN, pageH - 20, { align: "right" });
    doc.text("AI Study Buddy", PAGE_MARGIN, pageH - 20);
  }

  const safeName = pdfName.replace(/\.pdf$/i, "").replace(/[^\w\-]+/g, "_");
  doc.save(`${safeName || "study"}-report.pdf`);
}
