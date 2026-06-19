import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiUploadCloud, FiFileText, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { extractPdfText } from "@/lib/pdf-extract";
import { useStudy } from "@/context/StudyContext";

export function UploadPanel({ onDone }: { onDone?: () => void }) {
  const { pdf, setPdf } = useStudy();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Please upload a PDF file.");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error("PDF too large (max 25MB).");
        return;
      }
      setBusy(true);
      setProgress(0);
      try {
        const data = await extractPdfText(file, setProgress);
        setPdf(data);
        toast.success(`Extracted ${data.totalPages} pages from ${data.pdfName}`);
        onDone?.();
      } catch (e) {
        console.error(e);
        toast.error("Failed to read PDF. Try another file.");
      } finally {
        setBusy(false);
      }
    },
    [setPdf, onDone],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Upload your study material</h1>
        <p className="text-muted-foreground mt-1">
          Drop a textbook, lecture notes, slides, or research paper. We'll turn it into notes, a
          quiz, and a tutor you can chat with.
        </p>
      </header>

      <motion.label
        htmlFor="pdf-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        animate={{ scale: dragOver ? 1.01 : 1 }}
        className={`block cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border bg-card"
        }`}
      >
        <input
          id="pdf-input"
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <div className="mx-auto size-16 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-card mb-4">
          <FiUploadCloud className="size-8" />
        </div>
        <div className="font-semibold text-lg">Drag & drop your PDF here</div>
        <div className="text-sm text-muted-foreground mt-1">
          or click to browse — up to 25 MB
        </div>
        <Button type="button" className="mt-5" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
      </motion.label>

      {busy && (
        <div className="glass rounded-2xl p-5">
          <div className="text-sm mb-2 font-medium">Extracting text… {progress}%</div>
          <Progress value={progress} />
        </div>
      )}

      {pdf && !busy && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 flex items-start gap-4"
        >
          <FiFileText className="size-8 text-primary mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2">
              {pdf.pdfName}
              <FiCheckCircle className="text-accent" />
            </div>
            <div className="text-sm text-muted-foreground">
              {pdf.totalPages} pages • {pdf.content.length.toLocaleString()} characters extracted
            </div>
            <p className="text-sm mt-3 line-clamp-3 text-foreground/80">
              {pdf.content.slice(0, 320)}…
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
