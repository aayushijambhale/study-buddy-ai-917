import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ExtractedPdf } from "@/lib/pdf-extract";

export interface QuizMCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}
export interface QuizTF {
  question: string;
  answer: "True" | "False" | string;
  explanation: string;
}
export interface QuizShort {
  question: string;
  answer: string;
  explanation: string;
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

interface StudyState {
  pdf: ExtractedPdf | null;
  setPdf: (p: ExtractedPdf | null) => void;
  notes: string;
  setNotes: (s: string) => void;
  quiz: QuizData | null;
  setQuiz: (q: QuizData | null) => void;
  chat: ChatMessage[];
  setChat: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const Ctx = createContext<StudyState | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [pdf, setPdf] = useState<ExtractedPdf | null>(null);
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const value = useMemo(
    () => ({ pdf, setPdf, notes, setNotes, quiz, setQuiz, chat, setChat }),
    [pdf, notes, quiz, chat],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudy() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudy must be used inside StudyProvider");
  return v;
}
