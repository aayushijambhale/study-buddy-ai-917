import { motion } from "framer-motion";
import { FiUpload, FiBookOpen, FiHelpCircle, FiMessageCircle, FiMic } from "react-icons/fi";
import { cn } from "@/lib/utils";

export type Tab = "upload" | "notes" | "quiz" | "ask" | "voice";

const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "upload", label: "Upload PDF", icon: <FiUpload /> },
  { id: "notes", label: "Smart Notes", icon: <FiBookOpen /> },
  { id: "quiz", label: "Auto Quiz", icon: <FiHelpCircle /> },
  { id: "ask", label: "Ask PDF", icon: <FiMessageCircle /> },
  { id: "voice", label: "Voice Tutor", icon: <FiMic /> },
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
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-5 gap-2">
      <div className="flex items-center gap-2 mb-6">
        <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground font-bold shadow-card">
          SB
        </div>
        <div>
          <div className="font-semibold leading-tight">Study Buddy</div>
          <div className="text-xs text-sidebar-foreground/70">AI Learning Companion</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
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
      </nav>

      <div className="mt-auto pt-4">
        <div className="rounded-xl bg-sidebar-accent/40 p-3 text-xs">
          <div className="font-medium opacity-90 mb-1">Current document</div>
          <div className="truncate opacity-80">{pdfName ?? "No PDF uploaded"}</div>
        </div>
      </div>
    </aside>
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
