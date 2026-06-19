import { motion } from "framer-motion";
import {
  FiBookOpen,
  FiHelpCircle,
  FiLayers,
  FiImage,
  FiMessageCircle,
  FiMic,
  FiVolume2,
  FiActivity,
} from "react-icons/fi";
import { useStudy } from "@/context/StudyContext";

export function DashboardPanel() {
  const { analytics, theme, fontScale, pdf, flashcards, studyPlan } = useStudy();

  const features = [
    { key: "Dark / High-contrast theme", on: theme !== "light" },
    { key: "Larger text", on: fontScale !== "base" },
    { key: "PDF loaded", on: !!pdf },
    { key: "Flashcards generated", on: flashcards.length > 0 },
    { key: "Study plan built", on: !!studyPlan },
  ];
  const score = Math.round((features.filter((f) => f.on).length / features.length) * 100);

  const stats = [
    { label: "Notes generated", value: analytics.notesGenerated, icon: <FiBookOpen /> },
    { label: "Quizzes generated", value: analytics.quizzesGenerated, icon: <FiHelpCircle /> },
    { label: "Flashcards created", value: analytics.flashcardsGenerated, icon: <FiLayers /> },
    { label: "Images described", value: analytics.imagesDescribed, icon: <FiImage /> },
    { label: "Questions asked", value: analytics.questionsAsked, icon: <FiMessageCircle /> },
    { label: "Voice commands used", value: analytics.voiceCommands, icon: <FiMic /> },
    { label: "Read-aloud sessions", value: analytics.readAloudCount, icon: <FiVolume2 /> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Accessibility Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your learning progress and the accessibility features you have enabled.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:col-span-1"
        >
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Accessibility score
          </div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-5xl font-bold">{score}</div>
            <div className="text-muted-foreground mb-1.5">/ 100</div>
          </div>
          <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {features.map((f) => (
              <li key={f.key} className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${f.on ? "bg-accent" : "bg-muted-foreground/40"}`}
                />
                <span className={f.on ? "" : "text-muted-foreground"}>{f.key}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border p-4 shadow-card"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wide">{s.label}</span>
                <span className="text-accent">{s.icon}</span>
              </div>
              <div className="text-3xl font-bold mt-2">{s.value}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex items-start gap-4">
        <FiActivity className="text-primary size-6 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          All metrics are stored on your device — nothing is sent to a server. Switch themes,
          larger text, and voice navigation in the sidebar to boost your accessibility score.
        </div>
      </div>
    </div>
  );
}
