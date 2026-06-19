import { useCallback, useEffect, useRef, useState } from "react";

interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: (e: unknown) => void;
}

export type NavCommand =
  | "upload"
  | "notes"
  | "quiz"
  | "ask"
  | "voice"
  | "flashcards"
  | "planner"
  | "image"
  | "dashboard"
  | "read"
  | "stop";

const KEYWORDS: Record<NavCommand, string[]> = {
  upload: ["upload", "upload pdf"],
  notes: ["notes", "open notes", "smart notes", "read notes", "generate notes"],
  quiz: ["quiz", "open quiz", "start quiz", "generate quiz"],
  ask: ["ask", "ask pdf", "chat", "ask question"],
  voice: ["voice", "voice tutor"],
  flashcards: ["flashcards", "flash cards", "open flashcards"],
  planner: ["planner", "study planner", "plan"],
  image: ["image", "describe image", "open image"],
  dashboard: ["dashboard", "open dashboard", "stats"],
  read: ["read aloud", "read it"],
  stop: ["stop", "stop reading", "be quiet"],
};

function detect(text: string): NavCommand | null {
  const t = text.toLowerCase().trim();
  // longer keywords first to avoid 'notes' matching 'read notes'
  const pairs: { cmd: NavCommand; kw: string }[] = [];
  (Object.keys(KEYWORDS) as NavCommand[]).forEach((cmd) =>
    KEYWORDS[cmd].forEach((kw) => pairs.push({ cmd, kw })),
  );
  pairs.sort((a, b) => b.kw.length - a.kw.length);
  for (const { cmd, kw } of pairs) {
    if (t.includes(kw)) return cmd;
  }
  return null;
}

export function useVoiceNav(onCommand: (cmd: NavCommand, raw: string) => void) {
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SR | null>(null);
  const handlerRef = useRef(onCommand);
  handlerRef.current = onCommand;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript;
      setTranscript(text);
      const cmd = detect(text);
      if (cmd) handlerRef.current(cmd, text);
    };
    rec.onend = () => setActive(false);
    rec.onerror = () => setActive(false);
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const supported =
    typeof window !== "undefined" &&
    !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.start();
      setActive(true);
    } catch {
      /* already started */
    }
  }, []);
  const stop = useCallback(() => {
    recRef.current?.stop();
    setActive(false);
  }, []);
  const toggle = useCallback(() => {
    if (active) stop();
    else start();
  }, [active, start, stop]);

  return { supported, active, transcript, start, stop, toggle };
}
