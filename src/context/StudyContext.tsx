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

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyDay {
  day: number;
  date?: string;
  focus: string;
  tasks: string[];
}
export interface StudyPlan {
  examDate: string;
  totalDays: number;
  dailyHours: number;
  overview: string;
  days: StudyDay[];
}

export interface ImageDescriptionEntry {
  id: string;
  name: string;
  dataUrl: string;
  description: string;
  createdAt: number;
}

export type Theme = "light" | "dark" | "contrast";
export type FontScale = "base" | "lg" | "xl";

export interface Analytics {
  notesGenerated: number;
  quizzesGenerated: number;
  flashcardsGenerated: number;
  imagesDescribed: number;
  voiceCommands: number;
  questionsAsked: number;
  readAloudCount: number;
  readingSeconds: number;
}

const DEFAULT_ANALYTICS: Analytics = {
  notesGenerated: 0,
  quizzesGenerated: 0,
  flashcardsGenerated: 0,
  imagesDescribed: 0,
  voiceCommands: 0,
  questionsAsked: 0,
  readAloudCount: 0,
  readingSeconds: 0,
};

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

  flashcards: Flashcard[];
  setFlashcards: (f: Flashcard[]) => void;
  studyPlan: StudyPlan | null;
  setStudyPlan: (p: StudyPlan | null) => void;
  imageDescriptions: ImageDescriptionEntry[];
  addImageDescription: (e: ImageDescriptionEntry) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;

  analytics: Analytics;
  bump: (k: keyof Analytics, by?: number) => void;

  openPdfAt: (page: number, highlight?: string) => void;
  viewer: { open: boolean; page: number; highlight?: string };
  closeViewer: () => void;
}

const Ctx = createContext<StudyState | null>(null);

const THEME_KEY = "study-buddy:theme";
const SCALE_KEY = "study-buddy:font-scale";
const STATS_KEY = "study-buddy:analytics";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.classList.toggle("contrast", t === "contrast");
}
function applyScale(s: FontScale) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.fontScale = s;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [pdf, setPdf] = useState<ExtractedPdf | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [explanations, setExplanations] = useState<SavedExplanation[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [imageDescriptions, setImageDescriptions] = useState<ImageDescriptionEntry[]>([]);
  const [theme, setThemeState] = useState<Theme>("light");
  const [fontScale, setFontScaleState] = useState<FontScale>("base");
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS);
  const [viewer, setViewer] = useState<{ open: boolean; page: number; highlight?: string }>({
    open: false,
    page: 1,
  });

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      const prefers =
        window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const t = storedTheme ?? prefers;
      setThemeState(t);
      applyTheme(t);

      const storedScale = (localStorage.getItem(SCALE_KEY) as FontScale | null) ?? "base";
      setFontScaleState(storedScale);
      applyScale(storedScale);

      const storedStats = localStorage.getItem(STATS_KEY);
      if (storedStats) setAnalytics({ ...DEFAULT_ANALYTICS, ...JSON.parse(storedStats) });
    } catch {
      /* noop */
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* noop */
    }
    applyTheme(t);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const order: Theme[] = ["light", "dark", "contrast"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* noop */
      }
      applyTheme(next);
      return next;
    });
  }, []);

  const setFontScale = useCallback((s: FontScale) => {
    setFontScaleState(s);
    try {
      localStorage.setItem(SCALE_KEY, s);
    } catch {
      /* noop */
    }
    applyScale(s);
  }, []);

  const bump = useCallback((k: keyof Analytics, by = 1) => {
    setAnalytics((a) => {
      const next = { ...a, [k]: a[k] + by };
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const addExplanation = useCallback((e: SavedExplanation) => {
    setExplanations((arr) => [...arr, e]);
  }, []);
  const addImageDescription = useCallback((e: ImageDescriptionEntry) => {
    setImageDescriptions((arr) => [e, ...arr]);
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
      pdf, setPdf, file, setFile, notes, setNotes, quiz, setQuiz, chat, setChat,
      explanations, addExplanation,
      flashcards, setFlashcards, studyPlan, setStudyPlan,
      imageDescriptions, addImageDescription,
      theme, setTheme, cycleTheme, fontScale, setFontScale,
      analytics, bump,
      openPdfAt, viewer, closeViewer,
    }),
    [
      pdf, file, notes, quiz, chat, explanations, addExplanation,
      flashcards, studyPlan, imageDescriptions, addImageDescription,
      theme, setTheme, cycleTheme, fontScale, setFontScale,
      analytics, bump,
      openPdfAt, viewer, closeViewer,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudy() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudy must be used inside StudyProvider");
  return v;
}
