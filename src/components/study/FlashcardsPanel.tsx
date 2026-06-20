import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap,
  FiVolume2,
  FiRefreshCw,
  FiClock,
  FiCheck,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy, type Flashcard } from "@/context/StudyContext";
import { generateFlashcards } from "@/lib/study.functions";
import { speak } from "@/hooks/use-voice";
import { initialSM2, isDue, reviewSM2, dueLabel } from "@/lib/sm2";
import { cn } from "@/lib/utils";

export function FlashcardsPanel() {
  const {
    pdf,
    flashcards,
    setFlashcards,
    updateFlashcard,
    bump,
    awardXp,
    language,
  } = useStudy();
  const [loading, setLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ done: 0, correct: 0 });

  const dueCards = useMemo(
    () =>
      flashcards
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => isDue(c.sm2)),
    [flashcards],
  );

  const run = async () => {
    if (!pdf) return;
    setLoading(true);
    try {
      const res = await generateFlashcards({ data: { text: pdf.content } });
      const withSm2: Flashcard[] = res.cards.map((c) => ({
        front: c.front,
        back: c.back,
        sm2: initialSM2(),
      }));
      setFlashcards(withSm2);
      setIndex(0);
      setFlipped(false);
      setReviewMode(false);
      bump("flashcardsGenerated", withSm2.length);
      awardXp(15);
      toast.success(`Generated ${withSm2.length} cards`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  // Browse mode card (all cards) vs review (due only)
  const list = reviewMode ? dueCards.map((d) => d.c) : flashcards;
  const card = list[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (list.length ? (i + 1) % list.length : 0));
  };
  const prev = () => {
    setFlipped(false);
    setIndex((i) => (list.length ? (i - 1 + list.length) % list.length : 0));
  };

  const review = (quality: 0 | 3 | 4 | 5) => {
    if (!reviewMode) return;
    const original = dueCards[index];
    if (!original) return;
    const updated: Flashcard = {
      ...original.c,
      sm2: reviewSM2(original.c.sm2, quality),
    };
    updateFlashcard(original.i, updated);
    bump("cardsReviewed");
    awardXp(quality >= 3 ? 5 : 2);
    setSessionStats((s) => ({
      done: s.done + 1,
      correct: s.correct + (quality >= 3 ? 1 : 0),
    }));
    setFlipped(false);
    // After update, dueCards recomputes — keep index pointing to next-in-list
    setIndex((i) => Math.min(i, Math.max(0, dueCards.length - 2)));
  };

  if (!pdf && !flashcards.length) {
    return <Empty msg="Upload a PDF first to generate flashcards." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Spaced repetition using the SM-2 algorithm. Cards re-appear when they're due.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {flashcards.length > 0 && (
            <Button
              variant={reviewMode ? "default" : "outline"}
              onClick={() => {
                if (!dueCards.length) {
                  toast.info("Nothing is due right now. Check back later!");
                  return;
                }
                setReviewMode((v) => !v);
                setIndex(0);
                setFlipped(false);
                setSessionStats({ done: 0, correct: 0 });
              }}
            >
              <FiClock className="mr-1" />
              {reviewMode ? "Exit review" : `Review (${dueCards.length} due)`}
            </Button>
          )}
          {pdf && (
            <Button onClick={run} disabled={loading} variant={flashcards.length ? "outline" : "default"}>
              <FiZap className="mr-1" />
              {flashcards.length
                ? loading
                  ? "Generating…"
                  : "Regenerate"
                : loading
                ? "Generating…"
                : "Generate cards"}
            </Button>
          )}
        </div>
      </header>

      {flashcards.length > 0 && (
        <div className="glass rounded-2xl p-4 grid grid-cols-3 gap-3 text-center text-sm">
          <Stat label="Total" value={flashcards.length} />
          <Stat label="Due now" value={dueCards.length} />
          <Stat
            label="Avg ease"
            value={
              (
                flashcards.reduce((a, c) => a + c.sm2.ease, 0) / flashcards.length
              ).toFixed(2)
            }
          />
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-10 text-center animate-pulse text-muted-foreground">
          Building your deck…
        </div>
      )}

      {!loading && reviewMode && list.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          🎉 You're all caught up. Session: {sessionStats.correct}/{sessionStats.done} correct.
          <div className="mt-3">
            <Button variant="outline" onClick={() => setReviewMode(false)}>
              Browse deck
            </Button>
          </div>
        </div>
      )}

      {card && (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Card {index + 1} of {list.length}
              {reviewMode && ` • Session ${sessionStats.correct}/${sessionStats.done}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiClock className="size-3.5" /> {dueLabel(card.sm2)}
              <span className="opacity-60">· ease {card.sm2.ease.toFixed(2)}</span>
            </span>
          </div>
          <div className="[perspective:1500px]">
            <motion.button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-3xl"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ transformStyle: "preserve-3d" }}
              aria-label={flipped ? "Show question side" : "Show answer side"}
            >
              <CardFace label="Question" content={card.front} />
              <CardFace label="Answer" content={card.back} back />
            </motion.button>
          </div>

          {reviewMode ? (
            <div className="grid grid-cols-4 gap-2">
              <ReviewBtn label="Again" color="bg-destructive" onClick={() => review(0)} />
              <ReviewBtn label="Hard" color="bg-amber-500" onClick={() => review(3)} />
              <ReviewBtn label="Good" color="bg-emerald-500" onClick={() => review(4)} />
              <ReviewBtn label="Easy" color="bg-sky-500" onClick={() => review(5)} />
            </div>
          ) : (
            <div className="flex justify-center items-center gap-3">
              <Button variant="outline" size="lg" onClick={prev} aria-label="Previous card">
                <FiRefreshCw className="rotate-180" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => speak(flipped ? card.back : card.front, language.bcp47)}
              >
                <FiVolume2 className="mr-1" /> Read
              </Button>
              <Button variant="outline" size="lg" onClick={next} aria-label="Next card">
                <FiRefreshCw />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-3 text-sm font-semibold text-white shadow-card hover:opacity-90 transition-opacity",
        color,
      )}
    >
      <FiCheck className="inline mr-1.5" />
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function CardFace({
  label,
  content,
  back = false,
}: {
  label: string;
  content: string;
  back?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-card ${
        back ? "bg-gradient-primary text-primary-foreground" : "bg-card text-card-foreground border"
      }`}
      style={{
        backfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      <div className="text-xs uppercase tracking-widest opacity-70 mb-4">{label}</div>
      <AnimatePresence mode="wait">
        <motion.div
          key={content}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-xl md:text-2xl font-semibold leading-snug max-w-2xl"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="glass rounded-2xl p-10 text-center text-muted-foreground">{msg}</div>;
}
