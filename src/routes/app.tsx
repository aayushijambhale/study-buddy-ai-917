import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { StudyProvider, useStudy } from "@/context/StudyContext";
import { Sidebar, MobileTabs, type Tab } from "@/components/study/Sidebar";
import { UploadPanel } from "@/components/study/UploadPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import { QuizPanel } from "@/components/study/QuizPanel";
import { ChatPanel } from "@/components/study/ChatPanel";
import { VoicePanel } from "@/components/study/VoicePanel";
import { FlashcardsPanel } from "@/components/study/FlashcardsPanel";
import { PlannerPanel } from "@/components/study/PlannerPanel";
import { ImageDescPanel } from "@/components/study/ImageDescPanel";
import { DashboardPanel } from "@/components/study/DashboardPanel";
import { PdfViewer } from "@/components/study/PdfViewer";
import { useVoiceNav, type NavCommand } from "@/hooks/use-voice-nav";
import { speak, stopSpeaking } from "@/hooks/use-voice";
import { FiMic, FiMicOff, FiHome } from "react-icons/fi";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — Accessible AI Study Buddy" },
      {
        name: "description",
        content:
          "Upload PDFs, generate notes, quizzes, flashcards, study plans and image descriptions, all in an accessibility-first workspace.",
      },
    ],
  }),
  component: () => (
    <StudyProvider>
      <App />
      <PdfViewer />
      <Toaster richColors position="top-right" />
    </StudyProvider>
  ),
});

function App() {
  const [tab, setTab] = useState<Tab>("upload");
  const { pdf, notes, bump } = useStudy();
  const navigate = useNavigate();

  const handleCommand = (cmd: NavCommand) => {
    bump("voiceCommands");
    const map: Partial<Record<NavCommand, Tab>> = {
      upload: "upload",
      notes: "notes",
      quiz: "quiz",
      ask: "ask",
      voice: "voice",
      flashcards: "flashcards",
      planner: "planner",
      image: "image",
      dashboard: "dashboard",
    };
    if (cmd === "read") {
      if (notes) {
        speak(notes.replace(/[#*_`>-]/g, ""));
        bump("readAloudCount");
      } else toast.info("Generate notes first.");
      return;
    }
    if (cmd === "stop") {
      stopSpeaking();
      return;
    }
    const target = map[cmd];
    if (target) {
      setTab(target);
      toast.success(`Voice: opened ${target}`);
    }
  };

  const voiceNav = useVoiceNav(handleCommand);

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-gradient-soft">
      <Sidebar active={tab} onChange={setTab} pdfName={pdf?.pdfName} />
      <MobileTabs active={tab} onChange={setTab} />

      <main className="flex-1 p-5 md:p-10 max-w-5xl mx-auto w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            <FiHome /> Home
          </Link>
          {voiceNav.supported && (
            <button
              onClick={voiceNav.toggle}
              aria-pressed={voiceNav.active}
              aria-label={voiceNav.active ? "Disable voice navigation" : "Enable voice navigation"}
              className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                voiceNav.active
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card hover:bg-muted/60"
              }`}
            >
              {voiceNav.active ? <FiMic /> : <FiMicOff />}
              {voiceNav.active ? "Voice nav on" : "Voice nav off"}
            </button>
          )}
        </div>

        {tab === "upload" && <UploadPanel onDone={() => setTab("notes")} />}
        {tab === "notes" && <NotesPanel />}
        {tab === "quiz" && <QuizPanel />}
        {tab === "flashcards" && <FlashcardsPanel />}
        {tab === "ask" && <ChatPanel />}
        {tab === "planner" && <PlannerPanel />}
        {tab === "voice" && <VoicePanel />}
        {tab === "image" && <ImageDescPanel />}
        {tab === "dashboard" && <DashboardPanel />}
      </main>
    </div>
  );
}
