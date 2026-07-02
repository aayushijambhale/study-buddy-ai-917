import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  FiUpload,
  FiBookOpen,
  FiHelpCircle,
  FiMessageCircle,
  FiMic,
  FiSun,
  FiMoon,
  FiEye,
  FiLayers,
  FiCalendar,
  FiImage,
  FiBarChart2,
  FiType,
  FiShare2,
  FiGlobe,
  FiZap,
  FiUsers,
} from "react-icons/fi";
import { useStudy, LANGUAGES } from "@/context/StudyContext";
import { level } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export type Tab =
  | "upload"
  | "notes"
  | "quiz"
  | "ask"
  | "voice"
  | "flashcards"
  | "planner"
  | "image"
  | "mindmap"
  | "dashboard";

const items: { id: Tab; label: string; icon: React.ReactNode; group: "Study" | "Accessibility" }[] = [
  { id: "upload", label: "Upload PDF", icon: <FiUpload />, group: "Study" },
  { id: "notes", label: "Smart Notes", icon: <FiBookOpen />, group: "Study" },
  { id: "quiz", label: "Auto Quiz", icon: <FiHelpCircle />, group: "Study" },
  { id: "flashcards", label: "Flashcards", icon: <FiLayers />, group: "Study" },
  { id: "mindmap", label: "Mind Map", icon: <FiShare2 />, group: "Study" },
  { id: "ask", label: "Ask PDF", icon: <FiMessageCircle />, group: "Study" },
  { id: "planner", label: "Planner & Timer", icon: <FiCalendar />, group: "Study" },
  { id: "voice", label: "Voice Tutor", icon: <FiMic />, group: "Accessibility" },
  { id: "image", label: "Describe Image", icon: <FiImage />, group: "Accessibility" },
  { id: "dashboard", label: "Progress", icon: <FiBarChart2 />, group: "Accessibility" },
];

export function Sidebar({
  active,
  onChange,
  pdfName,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  pdfName?: string;
}) {
  const groups = ["Study", "Accessibility"] as const;
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-5 gap-2 max-h-screen overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground font-bold shadow-card">
          SB
        </div>
        <div>
          <div className="font-semibold leading-tight">Study Buddy</div>
          <div className="text-xs text-sidebar-foreground/70">AI + Accessibility</div>
        </div>
      </div>

      <XpChip />

      <nav className="flex flex-col gap-3 mt-2">
        {groups.map((g) => (
          <div key={g}>
            <div className="text-[10px] uppercase tracking-widest opacity-60 px-3 mb-1">
              {g}
            </div>
            <div className="flex flex-col gap-1">
              {items
                .filter((it) => it.group === g)
                .map((it) => {
                  const isActive = active === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => onChange(it.id)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/40",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-sidebar-accent"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 text-base">{it.icon}</span>
                      <span className="relative z-10">{it.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 space-y-2">
        <Link
          to="/rooms"
          className="flex items-center justify-between rounded-xl bg-sidebar-accent/40 px-3 py-2 text-sm hover:bg-sidebar-accent/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FiUsers /> Study Rooms
          </span>
          <span className="text-[10px] opacity-60">live</span>
        </Link>
        <LanguagePicker />
        <ThemeToggle />
        <FontScaleToggle />
        <div className="rounded-xl bg-sidebar-accent/40 p-3 text-xs">
          <div className="font-medium opacity-90 mb-1">Current document</div>
          <div className="truncate opacity-80">{pdfName ?? "No PDF uploaded"}</div>
        </div>
      </div>
    </aside>
  );
}

function XpChip() {
  const { gamification } = useStudy();
  const lvl = level(gamification.xp);
  return (
    <div className="rounded-xl bg-gradient-primary text-primary-foreground p-3 shadow-card">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <FiZap /> Level {lvl.level}
        </span>
        <span className="opacity-90">🔥 {gamification.streak}d</span>
      </div>
      <div className="text-lg font-bold mt-1 leading-none">{gamification.xp} XP</div>
      <div className="mt-2 h-1.5 rounded-full bg-white/25 overflow-hidden">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, Math.min(100, lvl.progress * 100))}%` }}
        />
      </div>
      <div className="text-[10px] opacity-80 mt-1">
        {gamification.xp - lvl.prevXp} / {lvl.nextXp - lvl.prevXp} to next
      </div>
    </div>
  );
}

function LanguagePicker() {
  const { language, setLanguage } = useStudy();
  return (
    <label className="flex items-center justify-between gap-2 rounded-xl bg-sidebar-accent/40 px-3 py-2 text-sm">
      <span className="flex items-center gap-2">
        <FiGlobe /> Language
      </span>
      <select
        value={language.code}
        onChange={(e) => {
          const next = LANGUAGES.find((l) => l.code === e.target.value);
          if (next) setLanguage(next);
        }}
        className="bg-transparent text-xs font-medium outline-none cursor-pointer"
        aria-label="Output language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-foreground">
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ThemeToggle() {
  const { theme, cycleTheme } = useStudy();
  const icon =
    theme === "dark" ? <FiMoon /> : theme === "contrast" ? <FiEye /> : <FiSun />;
  const label =
    theme === "dark" ? "Dark" : theme === "contrast" ? "High contrast" : "Light";
  return (
    <button
      onClick={cycleTheme}
      className="w-full flex items-center justify-between rounded-xl bg-sidebar-accent/40 px-3 py-2 text-sm hover:bg-sidebar-accent/60 transition-colors"
      aria-label={`Theme: ${label}. Click to cycle.`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      <span className="text-[10px] opacity-60">cycle</span>
    </button>
  );
}

function FontScaleToggle() {
  const { fontScale, setFontScale } = useStudy();
  const opts: { id: "base" | "lg" | "xl"; label: string }[] = [
    { id: "base", label: "A" },
    { id: "lg", label: "A+" },
    { id: "xl", label: "A++" },
  ];
  return (
    <div
      className="flex items-center justify-between rounded-xl bg-sidebar-accent/40 px-3 py-2 text-sm"
      role="group"
      aria-label="Text size"
    >
      <span className="flex items-center gap-2">
        <FiType /> Text size
      </span>
      <div className="flex gap-1">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => setFontScale(o.id)}
            aria-pressed={fontScale === o.id}
            className={cn(
              "px-2 py-0.5 rounded-md text-xs transition-colors",
              fontScale === o.id
                ? "bg-sidebar-foreground text-sidebar"
                : "hover:bg-sidebar-accent/60",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MobileTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="md:hidden flex overflow-x-auto gap-1 p-2 bg-sidebar text-sidebar-foreground">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs whitespace-nowrap",
            active === it.id
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "opacity-80",
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </nav>
  );
}
