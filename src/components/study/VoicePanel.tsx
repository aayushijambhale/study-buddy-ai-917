import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMic, FiVolume2 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { askPdf } from "@/lib/study.functions";
import { useSpeechRecognition, speak, stopSpeaking } from "@/hooks/use-voice";

export function VoicePanel() {
  const { pdf } = useStudy();
  const voice = useSpeechRecognition();
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastQ, setLastQ] = useState("");

  useEffect(() => {
    if (!voice.listening && voice.transcript.trim() && voice.transcript !== lastQ) {
      const q = voice.transcript.trim();
      setLastQ(q);
      void ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.listening]);

  const ask = async (q: string) => {
    if (!pdf) {
      toast.error("Upload a PDF first.");
      return;
    }
    setBusy(true);
    setAnswer("");
    try {
      const res = await askPdf({ data: { text: pdf.content, question: q } });
      setAnswer(res.answer);
      speak(res.answer.replace(/[#*_`>-]/g, ""));
    } catch {
      toast.error("Voice query failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Voice Tutor</h1>
        <p className="text-muted-foreground mt-1">
          Press the mic, speak your question. The tutor answers out loud using your PDF.
        </p>
      </header>

      {!voice.supported && (
        <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
          Voice input isn't supported in this browser. Try Chrome or Edge on desktop.
        </div>
      )}

      <div className="glass rounded-3xl p-10 text-center">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => (voice.listening ? voice.stop() : voice.start())}
          disabled={!voice.supported || busy}
          className="mx-auto size-32 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center shadow-card relative"
        >
          {voice.listening && (
            <motion.span
              className="absolute inset-0 rounded-full bg-accent/40"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
          <FiMic className="size-12 relative z-10" />
        </motion.button>
        <div className="mt-5 text-sm text-muted-foreground">
          {voice.listening
            ? "Listening… speak now"
            : busy
              ? "Thinking…"
              : "Tap to speak"}
        </div>
        {voice.transcript && (
          <div className="mt-4 text-foreground/80 italic">"{voice.transcript}"</div>
        )}
      </div>

      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide font-semibold text-accent">
              Answer
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => speak(answer.replace(/[#*_`>-]/g, ""))}
              >
                <FiVolume2 className="mr-1" /> Replay
              </Button>
              <Button size="sm" variant="ghost" onClick={stopSpeaking}>
                Stop
              </Button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
