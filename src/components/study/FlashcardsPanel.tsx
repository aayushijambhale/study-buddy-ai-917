import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiChevronLeft, FiChevronRight, FiVolume2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy } from "@/context/StudyContext";
import { generateFlashcards } from "@/lib/study.functions";
import { speak } from "@/hooks/use-voice";

export function FlashcardsPanel() {
  const { pdf, flashcards, setFlashcards, bump } = useStudy();
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!pdf) {
    return <Empty msg="Upload a PDF first to generate flashcards." />;
  }

  const run = async () => {
    setLoading(true);
    try {
      const res = await generateFlashcards({ data: { text: pdf.content } });
      setFlashcards(res.cards);
      setIndex(0);
      setFlipped(false);
      bump("flashcardsGenerated", res.cards.length);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const card = flashcards[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % flashcards.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Spaced-repetition style cards generated from your PDF. Click a card to flip it.
          </p>
        </div>
        <Button onClick={run} disabled={loading}>
          <FiZap className="mr-1" /> {flashcards.length ? "Regenerate" : loading ? "Generating…" : "Generate cards"}
        </Button>
      </header>

      {!flashcards.length && !loading && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Generate a deck to start reviewing.
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-10 text-center animate-pulse text-muted-foreground">
          Building your deck…
        </div>
      )}

      {card && (
        <>
          <div className="text-center text-sm text-muted-foreground">
            Card {index + 1} of {flashcards.length}
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
          <div className="flex justify-center items-center gap-3">
            <Button variant="outline" size="lg" onClick={prev} aria-label="Previous card">
              <FiChevronLeft />
            </Button>
            <Button variant="ghost" onClick={() => speak(flipped ? card.back : card.front)}>
              <FiVolume2 className="mr-1" /> Read
            </Button>
            <Button variant="outline" size="lg" onClick={next} aria-label="Next card">
              <FiChevronRight />
            </Button>
          </div>
        </>
      )}
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
