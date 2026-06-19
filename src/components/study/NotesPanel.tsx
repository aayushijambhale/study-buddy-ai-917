import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { FiZap, FiVolume2, FiMessageSquare, FiDownload } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { generateNotes, simplify } from "@/lib/study.functions";
import { speak, stopSpeaking } from "@/hooks/use-voice";
import { exportStudyReport } from "@/lib/export-pdf";

export function NotesPanel() {
  const { pdf, notes, setNotes, quiz, explanations, addExplanation } = useStudy();
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState("");
  const [simpleText, setSimpleText] = useState("");
  const [simpleLoading, setSimpleLoading] = useState(false);

  if (!pdf) {
    return <Empty msg="Upload a PDF first to generate notes." />;
  }

  const run = async () => {
    setLoading(true);
    try {
      const res = await generateNotes({ data: { text: pdf.content, pdfName: pdf.pdfName } });
      setNotes(res.notes);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate notes. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const explainSelection = async () => {
    const sel = window.getSelection()?.toString().trim() || selection.trim();
    if (!sel) {
      toast.info("Select some text in the notes first.");
      return;
    }
    setSelection(sel);
    setSimpleLoading(true);
    setSimpleText("");
    try {
      const res = await simplify({ data: { text: sel } });
      setSimpleText(res.explanation);
      addExplanation({ source: sel, explanation: res.explanation });
    } catch {
      toast.error("Couldn't simplify that.");
    } finally {
      setSimpleLoading(false);
    }
  };

  const handleExport = () => {
    if (!pdf) return;
    try {
      exportStudyReport({
        pdfName: pdf.pdfName,
        notes,
        quiz,
        explanations,
      });
      toast.success("Report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Notes</h1>
          <p className="text-muted-foreground mt-1">
            AI-condensed summary, key concepts, and exam revision points for{" "}
            <span className="font-medium text-foreground">{pdf.pdfName}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!notes && !quiz}>
            <FiDownload className="mr-1" /> Export PDF
          </Button>
          {notes && (
            <Button variant="outline" onClick={() => speak(notes.replace(/[#*_`>-]/g, ""))}>
              <FiVolume2 className="mr-1" /> Read aloud
            </Button>
          )}
          {notes && (
            <Button variant="ghost" onClick={stopSpeaking}>
              Stop
            </Button>
          )}
          <Button onClick={run} disabled={loading}>
            <FiZap className="mr-1" /> {notes ? "Regenerate" : loading ? "Generating…" : "Generate notes"}
          </Button>
        </div>
      </header>

      {!notes && !loading && (
        <Placeholder text="Click Generate notes to let the AI build a clean study guide from your PDF." />
      )}
      {loading && <SkeletonBlock />}

      {notes && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/85">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <FiMessageSquare className="text-accent" />
            <span className="text-sm text-muted-foreground">
              Select any tricky sentence above, then:
            </span>
            <Button size="sm" onClick={explainSelection} disabled={simpleLoading}>
              {simpleLoading ? "Thinking…" : "Explain like I'm 15"}
            </Button>
          </div>
          {simpleText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 rounded-xl bg-accent/10 border border-accent/30 p-4"
            >
              <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
                Simpler version
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{simpleText}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center text-muted-foreground">{msg}</div>
  );
}
function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
      {text}
    </div>
  );
}
function SkeletonBlock() {
  return (
    <div className="glass rounded-2xl p-6 space-y-3 animate-pulse">
      <div className="h-5 w-1/3 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-11/12 bg-muted rounded" />
      <div className="h-3 w-10/12 bg-muted rounded" />
      <div className="h-5 w-1/4 bg-muted rounded mt-4" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-9/12 bg-muted rounded" />
    </div>
  );
}
