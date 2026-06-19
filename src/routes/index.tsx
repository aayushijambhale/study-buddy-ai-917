import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { StudyProvider, useStudy } from "@/context/StudyContext";
import { Sidebar, MobileTabs, type Tab } from "@/components/study/Sidebar";
import { UploadPanel } from "@/components/study/UploadPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import { QuizPanel } from "@/components/study/QuizPanel";
import { ChatPanel } from "@/components/study/ChatPanel";
import { VoicePanel } from "@/components/study/VoicePanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Study Buddy – Turn PDFs into notes, quizzes & a tutor" },
      {
        name: "description",
        content:
          "Upload any PDF — textbook, slides, notes — and instantly get smart notes, quizzes, simple explanations, and a voice tutor powered by AI.",
      },
      { property: "og:title", content: "AI Study Buddy" },
      {
        property: "og:description",
        content:
          "Turn study PDFs into notes, quizzes, and a voice-enabled AI tutor.",
      },
    ],
  }),
  component: () => (
    <StudyProvider>
      <App />
      <Toaster richColors position="top-right" />
    </StudyProvider>
  ),
});

function App() {
  const [tab, setTab] = useState<Tab>("upload");
  const { pdf } = useStudy();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-soft">
      <Sidebar active={tab} onChange={setTab} pdfName={pdf?.pdfName} />
      <MobileTabs active={tab} onChange={setTab} />
      <main className="flex-1 p-5 md:p-10 max-w-5xl mx-auto w-full">
        {tab === "upload" && <UploadPanel onDone={() => setTab("notes")} />}
        {tab === "notes" && <NotesPanel />}
        {tab === "quiz" && <QuizPanel />}
        {tab === "ask" && <ChatPanel />}
        {tab === "voice" && <VoicePanel />}
      </main>
    </div>
  );
}
