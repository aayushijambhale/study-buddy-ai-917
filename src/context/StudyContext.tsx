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
import { initialSM2, type SM2State } from "@/lib/sm2";
import {
  DEFAULT_GAMIFICATION,
  addStudyMinutes,
  addXp,
  type GamificationState,
} from "@/lib/gamification";

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
  sm2: SM2State;
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

export interface MindMapBranch {
  label: string;
  color: string;
  children: { label: string; detail: string }[];
}
export interface MindMap {
  topic: string;
  branches: MindMapBranch[];
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
  mindMapsGenerated: number;
  cardsReviewed: number;
  answersGraded: number;
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
  mindMapsGenerated: 0,
  cardsReviewed: 0,
  answersGraded: 0,
};

export interface Language {
  code: string;   // e.g. "en", "es", "hi", "fr"
  name: string;   // "English", "Español"
  bcp47: string;  // for TTS, e.g. "en-US", "es-ES"
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", bcp47: "en-US" },
  { code: "es", name: "Español", bcp47: "es-ES" },
  { code: "hi", name: "हिन्दी", bcp47: "hi-IN" },
  { code: "fr", name: "Français", bcp47: "fr-FR" },
  { code: "de", name: "Deutsch", bcp47: "de-DE" },
  { code: "zh", name: "中文", bcp47: "zh-CN" },
  { code: "ar", name: "العربية", bcp47: "ar-SA" },
  { code: "pt", name: "Português", bcp47: "pt-BR" },
];

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
  updateFlashcard: (i: number, c: Flashcard) => void;

  studyPlan: StudyPlan | null;
  setStudyPlan: (p: StudyPlan | null) => void;
  imageDescriptions: ImageDescriptionEntry[];
  addImageDescription: (e: ImageDescriptionEntry) => void;

  mindMap: MindMap | null;
  setMindMap: (m: MindMap | null) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;

  language: Language;
  setLanguage: (l: Language) => void;

  analytics: Analytics;
  bump: (k: keyof Analytics, by?: number) => void;

  gamification: GamificationState;
  awardXp: (amount: number) => void;
  awardMinutes: (mins: number) => void;
  setWeeklyGoal: (mins: number) => void;

  openPdfAt: (page: number, highlight?: string) => void;
  viewer: { open: boolean; page: number; highlight?: string };
  closeViewer: () => void;
}

const Ctx = createContext<StudyState | null>(null);

const THEME_KEY = "study-buddy:theme";
const SCALE_KEY = "study-buddy:font-scale";
const STATS_KEY = "study-buddy:analytics";
const GAMI_KEY = "study-buddy:gamification";
const LANG_KEY = "study-buddy:language";
const DECK_KEY = "study-buddy:deck";

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
  const [flashcards, setFlashcardsState] = useState<Flashcard[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [imageDescriptions, setImageDescriptions] = useState<ImageDescriptionEntry[]>([]);
  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [theme, setThemeState] = useState<Theme>("light");
  const [fontScale, setFontScaleState] = useState<FontScale>("base");
  const [language, setLanguageState] = useState<Language>(LANGUAGES[0]);
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS);
  const [gamification, setGamification] = useState<GamificationState>(DEFAULT_GAMIFICATION);
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

      const storedGami = localStorage.getItem(GAMI_KEY);
      if (storedGami) setGamification({ ...DEFAULT_GAMIFICATION, ...JSON.parse(storedGami) });

      const storedLang = localStorage.getItem(LANG_KEY);
      if (storedLang) {
        const found = LANGUAGES.find((l) => l.code === storedLang);
        if (found) setLanguageState(found);
      }

      const storedDeck = localStorage.getItem(DECK_KEY);
      if (storedDeck) {
        const parsed = JSON.parse(storedDeck) as Flashcard[];
        if (Array.isArray(parsed)) setFlashcardsState(parsed);
      }
    } catch {
      /* noop */
    }
  }, []);

  const persistGami = useCallback((g: GamificationState) => {
    try {
      localStorage.setItem(GAMI_KEY, JSON.stringify(g));
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

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    try {
      localStorage.setItem(LANG_KEY, l.code);
    } catch {
      /* noop */
    }
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

  const awardXp = useCallback((amount: number) => {
    setGamification((g) => {
      const next = addXp(g, amount);
      persistGami(next);
      return next;
    });
  }, [persistGami]);

  const awardMinutes = useCallback((mins: number) => {
    setGamification((g) => {
      const next = addStudyMinutes(g, mins);
      persistGami(next);
      return next;
    });
  }, [persistGami]);

  const setWeeklyGoal = useCallback((mins: number) => {
    setGamification((g) => {
      const next = { ...g, weeklyGoal: Math.max(30, Math.min(2000, mins)) };
      persistGami(next);
      return next;
    });
  }, [persistGami]);

  const setFlashcards = useCallback((f: Flashcard[]) => {
    // ensure sm2 is initialised
    const normalised = f.map((c) => ({
      ...c,
      sm2: c.sm2 ?? initialSM2(),
    }));
    setFlashcardsState(normalised);
    try {
      localStorage.setItem(DECK_KEY, JSON.stringify(normalised));
    } catch {
      /* noop */
    }
  }, []);

  const updateFlashcard = useCallback((i: number, c: Flashcard) => {
    setFlashcardsState((arr) => {
      const next = arr.slice();
      next[i] = c;
      try {
        localStorage.setItem(DECK_KEY, JSON.stringify(next));
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
      flashcards, setFlashcards, updateFlashcard,
      studyPlan, setStudyPlan,
      imageDescriptions, addImageDescription,
      mindMap, setMindMap,
      theme, setTheme, cycleTheme, fontScale, setFontScale,
      language, setLanguage,
      analytics, bump,
      gamification, awardXp, awardMinutes, setWeeklyGoal,
      openPdfAt, viewer, closeViewer,
    }),
    [
      pdf, file, notes, quiz, chat, explanations, addExplanation,
      flashcards, setFlashcards, updateFlashcard,
      studyPlan, imageDescriptions, addImageDescription,
      mindMap,
      theme, setTheme, cycleTheme, fontScale, setFontScale,
      language, setLanguage,
      analytics, bump,
      gamification, awardXp, awardMinutes, setWeeklyGoal,
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
