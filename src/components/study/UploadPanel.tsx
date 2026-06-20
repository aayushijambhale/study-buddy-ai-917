import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiUploadCloud, FiFileText, FiCheckCircle, FiLink, FiGlobe } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { extractPdfText } from "@/lib/pdf-extract";
import { importFromUrl } from "@/lib/study.functions";
import { useStudy } from "@/context/StudyContext";

export function UploadPanel({ onDone }: { onDone?: () => void }) {
  const { pdf, setPdf, setFile, awardXp } = useStudy();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
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
        setFile(file);
        awardXp(10);
        toast.success(`Extracted ${data.totalPages} pages from ${data.pdfName}`);
        onDone?.();
      } catch (e) {
        console.error(e);
        toast.error("Failed to read PDF. Try another file.");
      } finally {
        setBusy(false);
      }
    },
    [setPdf, setFile, onDone, awardXp],
  );

  const handleUrl = async () => {
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Enter a valid http(s) URL.");
      return;
    }
    setUrlBusy(true);
    try {
      const data = await importFromUrl({ data: { url } });
      setPdf(data);
      setFile(null);
      awardXp(10);
      toast.success(`Imported ${data.totalPages} chunks from URL`);
      onDone?.();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to import URL");
    } finally {
      setUrlBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Upload your study material</h1>
        <p className="text-muted-foreground mt-1">
          Drop a textbook, paste a research-paper link, or import a Wikipedia article — we'll
          turn it into notes, a quiz, flashcards, and a tutor you can chat with.
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

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
          <FiGlobe className="text-primary" /> Import from URL
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Paste a Wikipedia article, blog post, documentation page, or research summary.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/Neural_network"
              className="pl-9"
              disabled={urlBusy}
              onKeyDown={(e) => e.key === "Enter" && handleUrl()}
            />
          </div>
          <Button onClick={handleUrl} disabled={urlBusy || !url}>
            {urlBusy ? "Importing…" : "Import"}
          </Button>
        </div>
      </div>

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
