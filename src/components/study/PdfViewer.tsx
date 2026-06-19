import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from "react-icons/fi";
import { useStudy } from "@/context/StudyContext";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export function PdfViewer() {
  const { viewer, closeViewer, file, pdf } = useStudy();
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load doc when viewer opens
  useEffect(() => {
    if (!viewer.open || !file) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const buf = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setPageNum(Math.max(1, Math.min(viewer.page, doc.numPages)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewer.open, viewer.page, file]);

  // Render current page
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !viewer.open) return;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageNum);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    })();
    return () => {
      cancelled = true;
    };
  }, [pageNum, scale, viewer.open]);

  if (!viewer.open) return null;

  const totalPages = docRef.current?.numPages ?? pdf?.totalPages ?? 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch justify-center p-4"
        onClick={closeViewer}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card text-card-foreground rounded-2xl shadow-card flex flex-col w-full max-w-4xl overflow-hidden"
        >
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b">
            <div className="min-w-0">
              <div className="font-semibold truncate">{pdf?.pdfName ?? "Document"}</div>
              <div className="text-xs text-muted-foreground">
                Page {pageNum} of {totalPages}
                {viewer.highlight && " • highlighted passage below"}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                title="Zoom out"
              >
                <FiZoomOut />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setScale((s) => Math.min(2.4, s + 0.2))}
                title="Zoom in"
              >
                <FiZoomIn />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
              >
                <FiChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
                disabled={pageNum >= totalPages}
              >
                <FiChevronRight />
              </Button>
              <Button size="icon" variant="ghost" onClick={closeViewer}>
                <FiX />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-muted/40 p-4 grid place-items-start justify-center">
            {!file ? (
              <div className="text-muted-foreground text-sm p-8">
                The original PDF file is no longer in memory. Re-upload it to view pages.
              </div>
            ) : loading ? (
              <div className="text-muted-foreground text-sm p-8">Loading PDF…</div>
            ) : (
              <canvas ref={canvasRef} className="shadow-card rounded" />
            )}
          </div>

          {viewer.highlight && (
            <div className="border-t bg-accent/10 px-4 py-3 max-h-40 overflow-y-auto">
              <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-1">
                Cited passage
              </div>
              <div className="text-sm text-foreground/85">{viewer.highlight}</div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
