import { Fragment } from "react";
import { useStudy } from "@/context/StudyContext";

interface Props {
  text: string;
}

/**
 * Renders text containing [p.N] or [p.N,M] markers, replacing each with a
 * clickable badge that opens the PDF viewer at that page.
 */
export function CitedText({ text }: Props) {
  const { openPdfAt, pdf } = useStudy();
  const re = /\[p\.\s*([0-9,\s]+)\]/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const pages = match[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    pages.forEach((p, i) => {
      parts.push(
        <button
          key={`${key}-${i}`}
          onClick={() => {
            const snippet = pdf?.pages.find((pg) => pg.page === p)?.text.slice(0, 280);
            openPdfAt(p, snippet);
          }}
          className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors align-baseline"
          title={`Open page ${p}`}
        >
          p.{p}
        </button>,
      );
    });
    last = match.index + match[0].length;
    key++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
