import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { FiSend, FiMic, FiVolume2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { askPdf } from "@/lib/study.functions";
import { useSpeechRecognition, speak, stopSpeaking } from "@/hooks/use-voice";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const { pdf, chat, setChat } = useStudy();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useSpeechRecognition();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, busy]);

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  if (!pdf)
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
        Upload a PDF to start asking questions.
      </div>
    );

  const send = async (override?: string) => {
    const q = (override ?? input).trim();
    if (!q) return;
    setInput("");
    voice.setTranscript("");
    const newChat = [...chat, { role: "user" as const, content: q }];
    setChat(newChat);
    setBusy(true);
    try {
      const res = await askPdf({
        data: {
          text: pdf.content,
          question: q,
          history: newChat.slice(-6),
        },
      });
      setChat((c) => [...c, { role: "assistant", content: res.answer }]);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't get an answer. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] gap-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Ask your PDF</h1>
        <p className="text-muted-foreground mt-1">
          Chat with <span className="font-medium text-foreground">{pdf.pdfName}</span>. Answers
          use only the document.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl glass p-4 space-y-4"
      >
        {chat.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p>Try asking:</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {[
                "Summarize chapter 1",
                "List key formulas",
                "What is the main conclusion?",
              ].map((s) => (
                <button
                  key={s}
                  className="rounded-full bg-card border px-3 py-1.5 text-sm hover:bg-accent/10"
                  onClick={() => void send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border shadow-card",
              )}
            >
              {m.role === "assistant" ? (
                <>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      onClick={() => speak(m.content.replace(/[#*_`>-]/g, ""))}
                    >
                      <FiVolume2 /> Read
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={stopSpeaking}
                    >
                      Stop
                    </button>
                  </div>
                </>
              ) : (
                m.content
              )}
            </div>
          </motion.div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl px-4 py-3 text-sm flex gap-1">
              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-2"
      >
        {voice.supported && (
          <Button
            type="button"
            variant={voice.listening ? "default" : "outline"}
            size="icon"
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            title="Voice input"
          >
            <FiMic className={voice.listening ? "animate-pulse" : ""} />
          </Button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about your PDF…"
          className="flex-1 rounded-xl border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <FiSend />
        </Button>
      </form>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="inline-block size-2 rounded-full bg-muted-foreground"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, delay }}
    />
  );
}
