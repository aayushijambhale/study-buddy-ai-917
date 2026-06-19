import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { FiImage, FiUploadCloud, FiVolume2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { describeImage } from "@/lib/study.functions";
import { speak, stopSpeaking } from "@/hooks/use-voice";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export function ImageDescPanel() {
  const { imageDescriptions, addImageDescription, bump } = useStudy();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image (JPG, PNG, WEBP).");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image too large (max 8 MB).");
        return;
      }
      setBusy(true);
      setDescription("");
      try {
        const dataUrl = await fileToDataUrl(file);
        setPreview(dataUrl);
        setName(file.name);
        const res = await describeImage({ data: { dataUrl } });
        setDescription(res.description);
        addImageDescription({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          description: res.description,
          createdAt: Date.now(),
        });
        bump("imagesDescribed");
        speak(res.description.replace(/[#*_`>-]/g, ""));
      } catch (e) {
        console.error(e);
        toast.error("Couldn't describe that image.");
      } finally {
        setBusy(false);
      }
    },
    [addImageDescription, bump],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Image Description</h1>
        <p className="text-muted-foreground mt-1">
          Upload a diagram, chart, or photo. The AI describes it in plain language and reads it
          aloud — built for visually impaired learners.
        </p>
      </header>

      <label
        htmlFor="img-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handle(f);
        }}
        className={`block cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border bg-card"
        }`}
      >
        <input
          id="img-input"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handle(f);
          }}
        />
        <div className="mx-auto size-14 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-card mb-3">
          <FiUploadCloud className="size-7" />
        </div>
        <div className="font-semibold">Drop an image here</div>
        <div className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP · up to 8 MB</div>
        <Button type="button" className="mt-4" onClick={() => inputRef.current?.click()}>
          Choose image
        </Button>
      </label>

      {busy && (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground animate-pulse">
          Reading the image…
        </div>
      )}

      {(preview || description) && !busy && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-4"
        >
          {preview && (
            <div className="rounded-2xl bg-card border p-3 shadow-card">
              <img
                src={preview}
                alt={name || "Uploaded diagram"}
                className="rounded-xl w-full object-contain max-h-[420px] bg-muted"
              />
            </div>
          )}
          {description && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wide font-semibold text-accent">
                  AI description
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => speak(description.replace(/[#*_`>-]/g, ""))}
                  >
                    <FiVolume2 className="mr-1" /> Read aloud
                  </Button>
                  <Button size="sm" variant="ghost" onClick={stopSpeaking}>
                    Stop
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{description}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {imageDescriptions.length > 1 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Recent images
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imageDescriptions.slice(0, 8).map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setPreview(e.dataUrl);
                  setDescription(e.description);
                  setName(e.name);
                }}
                className="rounded-xl overflow-hidden border bg-card hover:shadow-card transition-shadow text-left"
              >
                <img src={e.dataUrl} alt={e.name} className="w-full h-24 object-cover" />
                <div className="p-2 text-xs flex items-center gap-1.5">
                  <FiImage className="text-accent shrink-0" />
                  <span className="truncate">{e.name}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
