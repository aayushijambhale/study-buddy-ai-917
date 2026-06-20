import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX, FiRefreshCw, FiAward, FiFileText, FiZap } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy, type QuizData, type QuizShort } from "@/context/StudyContext";
import { generateQuiz, gradeShortAnswer } from "@/lib/study.functions";
import { cn } from "@/lib/utils";

function SourceBadge({ page }: { page?: number }) {
  const { openPdfAt, pdf } = useStudy();
  if (!page) return null;
  return (
    <button
      onClick={() => {
        const snippet = pdf?.pages.find((pg) => pg.page === page)?.text.slice(0, 280);
        openPdfAt(page, snippet);
      }}
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors"
      title={`View source on page ${page}`}
    >
      <FiFileText className="size-3" /> Source p.{page}
    </button>
  );
}

type Mode = "mcq" | "trueFalse" | "short";

export function QuizPanel() {
  const { pdf, quiz, setQuiz, bump, awardXp } = useStudy();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("mcq");

  if (!pdf) return <div className="glass rounded-2xl p-10 text-center text-muted-foreground">Upload a PDF to generate a quiz.</div>;

  const run = async () => {
    setLoading(true);
    try {
      const q = await generateQuiz({ data: { text: pdf.content } });
      setQuiz(q);
      bump("quizzesGenerated");
      awardXp(15);
      toast.success("Quiz ready!");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't build the quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto Quiz</h1>
          <p className="text-muted-foreground mt-1">
            10 MCQs, 10 True/False, and 5 short-answer questions generated from your PDF.
          </p>
        </div>
        <Button onClick={run} disabled={loading}>
          <FiRefreshCw className={cn("mr-1", loading && "animate-spin")} />
          {quiz ? "Regenerate quiz" : loading ? "Generating…" : "Generate quiz"}
        </Button>
      </header>

      {!quiz && !loading && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Click Generate quiz to start.
        </div>
      )}
      {loading && (
        <div className="glass rounded-2xl p-6 space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      )}

      {quiz && (
        <>
          <div className="flex gap-2">
            {(
              [
                ["mcq", `MCQ (${quiz.mcq.length})`],
                ["trueFalse", `True/False (${quiz.trueFalse.length})`],
                ["short", `Short (${quiz.short.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  mode === id
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-card border hover:bg-accent/10",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {mode === "mcq" && <MCQList quiz={quiz} />}
              {mode === "trueFalse" && <TFList quiz={quiz} />}
              {mode === "short" && <ShortList quiz={quiz} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function MCQList({ quiz }: { quiz: QuizData }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () =>
      submitted
        ? quiz.mcq.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0)
        : 0,
    [submitted, answers, quiz.mcq],
  );

  return (
    <div className="space-y-4">
      {quiz.mcq.map((q, i) => {
        const picked = answers[i];
        const correct = q.answer;
        return (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="font-semibold">
                {i + 1}. {q.question}
              </div>
              <SourceBadge page={q.sourcePage} />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const isPicked = picked === opt;
                const isCorrect = submitted && opt === correct;
                const isWrong = submitted && isPicked && opt !== correct;
                return (
                  <button
                    key={opt}
                    onClick={() => !submitted && setAnswers((a) => ({ ...a, [i]: opt }))}
                    className={cn(
                      "text-left rounded-xl border px-3 py-2 text-sm transition-colors",
                      isCorrect && "border-accent bg-accent/15",
                      isWrong && "border-destructive bg-destructive/10",
                      !submitted && isPicked && "border-primary bg-primary/10",
                      !submitted && !isPicked && "hover:bg-muted",
                    )}
                  >
                    {opt}
                    {isCorrect && <FiCheck className="inline ml-2 text-accent" />}
                    {isWrong && <FiX className="inline ml-2 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Explanation:</span> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between glass rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <FiAward className="text-accent" />
          {submitted ? (
            <span className="font-semibold">
              Score: {score} / {quiz.mcq.length}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              {Object.keys(answers).length} of {quiz.mcq.length} answered
            </span>
          )}
        </div>
        {!submitted ? (
          <Button onClick={() => setSubmitted(true)}>Submit</Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

function TFList({ quiz }: { quiz: QuizData }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = quiz.trueFalse.reduce(
    (a, q, i) =>
      a + (submitted && answers[i]?.toLowerCase() === q.answer.toLowerCase() ? 1 : 0),
    0,
  );

  return (
    <div className="space-y-4">
      {quiz.trueFalse.map((q, i) => {
        const picked = answers[i];
        return (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="font-semibold">
                {i + 1}. {q.question}
              </div>
              <SourceBadge page={q.sourcePage} />
            </div>
            <div className="flex gap-2">
              {["True", "False"].map((v) => {
                const isPicked = picked === v;
                const isCorrect = submitted && v.toLowerCase() === q.answer.toLowerCase();
                const isWrong = submitted && isPicked && !isCorrect;
                return (
                  <button
                    key={v}
                    onClick={() => !submitted && setAnswers((a) => ({ ...a, [i]: v }))}
                    className={cn(
                      "rounded-xl border px-5 py-2 text-sm font-medium",
                      isCorrect && "border-accent bg-accent/15",
                      isWrong && "border-destructive bg-destructive/10",
                      !submitted && isPicked && "border-primary bg-primary/10",
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Answer:</span> {q.answer}.{" "}
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between glass rounded-2xl p-4">
        {submitted ? (
          <span className="font-semibold">
            Score: {score} / {quiz.trueFalse.length}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">
            {Object.keys(answers).length} answered
          </span>
        )}
        {!submitted ? (
          <Button onClick={() => setSubmitted(true)}>Submit</Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

interface GradeResult {
  score: number;
  verdict: string;
  feedback: string;
  missing: string[];
}

function ShortList({ quiz }: { quiz: QuizData }) {
  return (
    <div className="space-y-4">
      {quiz.short.map((q, i) => (
        <ShortItem key={i} q={q} idx={i} />
      ))}
    </div>
  );
}

function ShortItem({ q, idx }: { q: QuizShort; idx: number }) {
  const { bump, awardXp } = useStudy();
  const [answer, setAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [showModel, setShowModel] = useState(false);

  const grade_ = async () => {
    if (!answer.trim()) {
      toast.info("Type your answer first.");
      return;
    }
    setGrading(true);
    try {
      const res = await gradeShortAnswer({
        data: { question: q.question, modelAnswer: q.answer, studentAnswer: answer },
      });
      setGrade(res);
      bump("answersGraded");
      awardXp(res.score);
    } catch (e) {
      console.error(e);
      toast.error("Grading failed.");
    } finally {
      setGrading(false);
    }
  };

  const verdictColor =
    grade?.verdict === "Correct"
      ? "border-accent bg-accent/10 text-accent"
      : grade?.verdict === "Incorrect"
      ? "border-destructive bg-destructive/10 text-destructive"
      : "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="font-semibold">
          {idx + 1}. {q.question}
        </div>
        <SourceBadge page={q.sourcePage} />
      </div>
      <textarea
        className="w-full rounded-xl border bg-card p-3 text-sm min-h-24"
        placeholder="Type your answer…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={grading}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={grade_} disabled={grading || !answer.trim()}>
          <FiZap className="mr-1" /> {grading ? "Grading…" : "Grade my answer"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowModel((s) => !s)}
        >
          {showModel ? "Hide" : "Show"} model answer
        </Button>
      </div>

      {grade && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("mt-4 rounded-xl border p-4 space-y-2", verdictColor)}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold flex items-center gap-2">
              <FiAward /> {grade.verdict}
            </div>
            <div className="text-2xl font-bold tabular-nums">{grade.score}/10</div>
          </div>
          <div className="text-sm">{grade.feedback}</div>
          {grade.missing.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Missing:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {grade.missing.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {showModel && (
        <div className="mt-3 rounded-xl bg-accent/10 border border-accent/30 p-3 text-sm">
          <div className="font-semibold mb-1">Model answer</div>
          <div>{q.answer}</div>
          {q.explanation && (
            <div className="mt-2 text-muted-foreground">{q.explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}
