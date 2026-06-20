import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiPlay, FiPause, FiRotateCcw, FiCoffee, FiTarget } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { cn } from "@/lib/utils";

type Phase = "focus" | "break";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

export function PomodoroTimer() {
  const { awardMinutes } = useStudy();
  const [phase, setPhase] = useState<Phase>("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(FOCUS_MIN * 60);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = (phase === "focus" ? FOCUS_MIN : BREAK_MIN) * 60;
  const progress = 1 - remaining / total;

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // Phase complete
          if (phase === "focus") {
            awardMinutes(FOCUS_MIN);
            setCompleted((c) => c + 1);
            toast.success(`Focus session done! +${FOCUS_MIN * 2} XP`);
            setPhase("break");
            return BREAK_MIN * 60;
          } else {
            toast.info("Break over — back to focus!");
            setPhase("focus");
            return FOCUS_MIN * 60;
          }
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, awardMinutes]);

  const reset = () => {
    setRunning(false);
    setRemaining((phase === "focus" ? FOCUS_MIN : BREAK_MIN) * 60);
  };

  const switchPhase = (p: Phase) => {
    setPhase(p);
    setRemaining((p === "focus" ? FOCUS_MIN : BREAK_MIN) * 60);
    setRunning(false);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-9 rounded-xl grid place-items-center text-white",
              phase === "focus" ? "bg-primary" : "bg-emerald-500",
            )}
          >
            {phase === "focus" ? <FiTarget /> : <FiCoffee />}
          </div>
          <div>
            <div className="font-semibold leading-tight">Pomodoro Timer</div>
            <div className="text-xs text-muted-foreground">
              {phase === "focus" ? "Focus session" : "Short break"} · {completed} done today
            </div>
          </div>
        </div>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => switchPhase("focus")}
            className={cn(
              "px-2.5 py-1 rounded-full",
              phase === "focus" ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            Focus
          </button>
          <button
            onClick={() => switchPhase("break")}
            className={cn(
              "px-2.5 py-1 rounded-full",
              phase === "break" ? "bg-emerald-500 text-white" : "bg-muted",
            )}
          >
            Break
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeOpacity="0.15" strokeWidth="8" fill="none" />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke={phase === "focus" ? "hsl(var(--primary))" : "rgb(16,185,129)"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              animate={{ strokeDashoffset: (1 - progress) * 2 * Math.PI * 45 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-2xl font-bold tabular-nums">
            {mm}:{ss}
          </div>
        </div>
        <div className="flex-1 flex flex-wrap gap-2">
          <Button onClick={() => setRunning((r) => !r)} size="lg" className="flex-1">
            {running ? <><FiPause className="mr-1" /> Pause</> : <><FiPlay className="mr-1" /> Start</>}
          </Button>
          <Button variant="outline" onClick={reset} size="lg" aria-label="Reset timer">
            <FiRotateCcw />
          </Button>
        </div>
      </div>
    </div>
  );
}
