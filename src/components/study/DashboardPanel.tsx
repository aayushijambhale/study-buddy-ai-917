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
  FiZap,
  FiShare2,
  FiAward,
} from "react-icons/fi";
import { useStudy } from "@/context/StudyContext";
import { computeBadges, level } from "@/lib/gamification";

export function DashboardPanel() {
  const { analytics, theme, fontScale, pdf, flashcards, studyPlan, gamification } = useStudy();
  const lvl = level(gamification.xp);
  const badges = computeBadges({
    state: gamification,
    notes: analytics.notesGenerated,
    quizzes: analytics.quizzesGenerated,
    flashcards: analytics.flashcardsGenerated,
    images: analytics.imagesDescribed,
    voiceCommands: analytics.voiceCommands,
    mindMaps: analytics.mindMapsGenerated,
  });

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
    { label: "Cards reviewed", value: analytics.cardsReviewed, icon: <FiActivity /> },
    { label: "Mind maps", value: analytics.mindMapsGenerated, icon: <FiShare2 /> },
    { label: "Answers graded", value: analytics.answersGraded, icon: <FiAward /> },
    { label: "Images described", value: analytics.imagesDescribed, icon: <FiImage /> },
    { label: "Questions asked", value: analytics.questionsAsked, icon: <FiMessageCircle /> },
    { label: "Voice commands", value: analytics.voiceCommands, icon: <FiMic /> },
    { label: "Read-aloud sessions", value: analytics.readAloudCount, icon: <FiVolume2 /> },
  ];

  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Progress & Accessibility</h1>
        <p className="text-muted-foreground mt-1">
          Track your XP, streak, badges, and the accessibility features you have enabled.
        </p>
      </header>

      {/* Gamification banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 shadow-card grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Big icon={<FiZap />} label="Level" value={lvl.level} />
        <Big label="Total XP" value={gamification.xp} />
        <Big label="🔥 Streak" value={`${gamification.streak} d`} />
        <Big label="🏆 Badges" value={`${earned}/${badges.length}`} />
        <div className="col-span-2 md:col-span-4 mt-1">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, lvl.progress * 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="text-xs opacity-85 mt-1.5">
            {gamification.xp - lvl.prevXp} / {lvl.nextXp - lvl.prevXp} XP to level {lvl.level + 1}
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FiAward className="text-accent" /> Badges
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-3 text-center transition-all ${
                b.earned
                  ? "bg-accent/10 border-accent shadow-card"
                  : "bg-muted/30 border-border opacity-60 grayscale"
              }`}
              title={b.description}
            >
              <div className="text-3xl">{b.emoji}</div>
              <div className="font-semibold text-xs mt-1">{b.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{b.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* A11y score + stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
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
          All metrics are stored on your device — nothing is sent to a server. Pomodoro sessions
          count toward your weekly goal and earn XP automatically.
        </div>
      </div>
    </div>
  );
}

function Big({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide opacity-85 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
