import { useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiZap, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { generateStudyPlan } from "@/lib/study.functions";
import { PomodoroTimer } from "./PomodoroTimer";

export function PlannerPanel() {
  const { pdf, studyPlan, setStudyPlan, awardXp, gamification, setWeeklyGoal } = useStudy();
  const [examDate, setExamDate] = useState("");
  const [chapters, setChapters] = useState("");
  const [hours, setHours] = useState(3);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!examDate || chapters.trim().length < 3) {
      toast.info("Add an exam date and at least one chapter.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateStudyPlan({
        data: {
          examDate,
          chapters,
          dailyHours: hours,
          context: pdf?.content,
        },
      });
      setStudyPlan({
        examDate,
        dailyHours: hours,
        totalDays: res.totalDays,
        overview: res.overview,
        days: res.days,
      });
      awardXp(20);
      toast.success("Plan ready!");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't build your plan.");
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.min(
    100,
    Math.round((gamification.weeklyMinutes / Math.max(1, gamification.weeklyGoal)) * 100),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground mt-1">
          Tell us when your exam is and what's left to cover — we'll build a day-by-day plan.
          Use the Pomodoro timer to track focus sessions toward your weekly goal.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PomodoroTimer />
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-1">Weekly study goal</div>
          <div className="text-xs text-muted-foreground mb-3">
            {gamification.weeklyMinutes} / {gamification.weeklyGoal} min
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <Label htmlFor="weekly-goal" className="text-xs">
            Goal (minutes/week)
          </Label>
          <Input
            id="weekly-goal"
            type="number"
            min={30}
            max={2000}
            step={30}
            value={gamification.weeklyGoal}
            onChange={(e) => setWeeklyGoal(Number(e.target.value) || 180)}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="exam-date">Exam date</Label>
          <Input
            id="exam-date"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="hours">Daily study hours</Label>
          <Input
            id="hours"
            type="number"
            min={0.5}
            max={16}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) || 1)}
            className="mt-1.5"
          />
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="chapters">Chapters / topics remaining</Label>
          <Textarea
            id="chapters"
            placeholder={"e.g.\nChapter 4 – Neural Networks\nChapter 5 – Backpropagation\nChapter 6 – CNNs"}
            value={chapters}
            onChange={(e) => setChapters(e.target.value)}
            rows={5}
            className="mt-1.5"
          />
        </div>
        <div className="md:col-span-3">
          <Button onClick={run} disabled={loading}>
            <FiZap className="mr-1" /> {loading ? "Building plan…" : "Generate plan"}
          </Button>
        </div>
      </div>

      {studyPlan && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="glass rounded-2xl p-5 flex gap-4 items-start">
            <FiCalendar className="text-primary size-6 mt-0.5" />
            <div>
              <div className="font-semibold">
                {studyPlan.totalDays} days · {studyPlan.dailyHours}h/day · exam on{" "}
                {studyPlan.examDate}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{studyPlan.overview}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {studyPlan.days.map((d) => (
              <div key={d.day} className="rounded-2xl bg-card border p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wide text-accent font-semibold">
                    Day {d.day}
                  </div>
                  {d.date && <div className="text-xs text-muted-foreground">{d.date}</div>}
                </div>
                <div className="font-semibold mb-2">{d.focus}</div>
                <ul className="space-y-1.5 text-sm">
                  {d.tasks.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <FiCheckCircle className="text-accent mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
