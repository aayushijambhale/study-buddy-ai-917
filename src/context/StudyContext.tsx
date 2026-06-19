import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExtractedPdf } from "@/lib/pdf-extract";

export interface QuizMCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  sourcePage?: number;
}
export interface QuizTF {
  question: string;
  answer: "True" | "False" | string;
  explanation: string;
  sourcePage?: number;
}
export interface QuizShort {
  question: string;
  answer: string;
  explanation: string;
  sourcePage?: number;
}
export interface QuizData {
  mcq: QuizMCQ[];
  trueFalse: QuizTF[];
  short: QuizShort[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedExplanation {
  source: string;
  explanation: string;
}

export type Theme = "light" | "dark";

interface StudyState {
  pdf: ExtractedPdf | null;
  setPdf: (p: ExtractedPdf | null) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  notes: string;
  setNotes: (s: string) => void;
  quiz: QuizData | null;
  setQuiz: (q: QuizData | null) => void;
  chat: ChatMessage[];
  setChat: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  explanations: SavedExplanation[];
  addExplanation: (e: SavedExplanation) => void;
  theme: Theme;
  toggleTheme: () => void;

  /** Open the in-app PDF viewer at a given page. */
  openPdfAt: (page: number, highlight?: string) => void;
  viewer: { open: boolean; page: number; highlight?: string };
  closeViewer: () => void;
}

const Ctx = createContext<StudyState | null>(null);

const THEME_KEY = "study-buddy:theme";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [pdf, setPdf] = useState<ExtractedPdf | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [explanations, setExplanations] = useState<SavedExplanation[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [viewer, setViewer] = useState<{
    open: boolean;
    page: number;
    highlight?: string;
  }>({ open: false, page: 1 });

  // Hydrate theme from localStorage on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      const prefers =
        window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const t = stored ?? prefers;
      setTheme(t);
      applyTheme(t);
    } catch {
      /* noop */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* noop */
      }
      applyTheme(next);
      return next;
    });
  }, []);

  const addExplanation = useCallback((e: SavedExplanation) => {
    setExplanations((arr) => [...arr, e]);
  }, []);

  const openPdfAt = useCallback((page: number, highlight?: string) => {
    setViewer({ open: true, page, highlight });
  }, []);
  const closeViewer = useCallback(
    () => setViewer((v) => ({ ...v, open: false })),
    [],
  );

  const value = useMemo<StudyState>(
    () => ({
      pdf,
      setPdf,
      file,
      setFile,
      notes,
      setNotes,
      quiz,
      setQuiz,
      chat,
      setChat,
      explanations,
      addExplanation,
      theme,
      toggleTheme,
      openPdfAt,
      viewer,
      closeViewer,
    }),
    [
      pdf,
      file,
      notes,
      quiz,
      chat,
      explanations,
      addExplanation,
      theme,
      toggleTheme,
      openPdfAt,
      viewer,
      closeViewer,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudy() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudy must be used inside StudyProvider");
  return v;
}
