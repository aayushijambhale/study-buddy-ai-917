import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiHelpCircle,
  FiImage,
  FiLayers,
  FiMic,
  FiVolume2,
  FiEye,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accessible AI Study Buddy — Learn smarter, accessible to all" },
      {
        name: "description",
        content:
          "Turn any PDF into smart notes, quizzes, flashcards, and a voice tutor. Built accessibility-first for students who learn by ear, by sight, or by voice.",
      },
      { property: "og:title", content: "Accessible AI Study Buddy" },
      {
        property: "og:description",
        content:
          "AI-powered notes, quizzes, image descriptions, and voice navigation — designed for every learner.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: <FiBookOpen />, title: "Smart Notes", desc: "Clean summaries, key concepts, and exam tips from any PDF." },
  { icon: <FiHelpCircle />, title: "Auto Quiz", desc: "MCQ, true/false, and short answers with page citations." },
  { icon: <FiLayers />, title: "Flashcards", desc: "Flip-card decks generated from your material." },
  { icon: <FiCalendar />, title: "Study Planner", desc: "Day-by-day plan from your exam date and hours." },
  { icon: <FiImage />, title: "Image Description", desc: "Diagrams and charts described aloud — for low-vision learners." },
  { icon: <FiMic />, title: "Voice Tutor", desc: "Speak your question, hear the answer from your PDF." },
];

const a11y = [
  { icon: <FiVolume2 />, title: "Read aloud everywhere" },
  { icon: <FiMic />, title: "Voice navigation" },
  { icon: <FiEye />, title: "High-contrast theme" },
  { icon: <FiCheckCircle />, title: "Keyboard accessible" },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-gradient-soft text-foreground">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground font-bold shadow-card">
            SB
          </div>
          <span className="font-semibold">Study Buddy</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/rooms"
            className="text-sm font-medium px-4 py-2 rounded-full border hover:bg-muted transition"
          >
            Study rooms
          </Link>
          <Link
            to="/app"
            className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Launch app
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 md:pt-20 pb-16 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-accent/20 text-accent-foreground border border-accent/30 px-3 py-1 text-xs font-medium"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            AI · Accessibility · Education
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]"
          >
            Learn smarter.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-primary">
              Accessible to all.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-lg text-muted-foreground max-w-xl"
          >
            Upload a PDF. Get clean notes, quizzes, flashcards, and a voice tutor — built
            accessibility-first for students with visual, hearing, or learning differences.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-medium shadow-card hover:opacity-95 transition"
            >
              Start studying <FiArrowRight />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card border font-medium hover:bg-muted/60 transition"
            >
              See features
            </a>
          </motion.div>
          <div className="mt-8 flex flex-wrap gap-3">
            {a11y.map((a) => (
              <div
                key={a.title}
                className="inline-flex items-center gap-2 text-sm bg-card border rounded-full px-3 py-1.5"
              >
                <span className="text-accent">{a.icon}</span>
                {a.title}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
          <div className="relative glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-destructive" />
              <span className="size-2 rounded-full bg-accent" />
              <span className="size-2 rounded-full bg-primary" />
              <span className="ml-2">organic-chemistry.pdf · 142 pages</span>
            </div>
            <div className="rounded-2xl bg-background/60 p-4 border">
              <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
                Smart Notes
              </div>
              <p className="text-sm leading-relaxed">
                <strong>Aromatic compounds</strong> are cyclic, planar molecules with delocalized
                π-electrons satisfying Hückel's rule (4n+2). Benzene is the canonical example…
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/60 p-4 border">
                <div className="text-xs text-muted-foreground mb-1">Quiz score</div>
                <div className="text-2xl font-bold">8 / 10</div>
              </div>
              <div className="rounded-2xl bg-background/60 p-4 border">
                <div className="text-xs text-muted-foreground mb-1">Cards reviewed</div>
                <div className="text-2xl font-bold">24</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-primary text-primary-foreground p-4">
              <div className="size-10 rounded-full bg-white/20 grid place-items-center">
                <FiMic />
              </div>
              <div className="text-sm">
                <div className="font-semibold">Voice tutor</div>
                <div className="opacity-90">"Explain Hückel's rule with an example"</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 md:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to study</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Nine modules powered by AI, wired into one accessible workspace.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-card border p-5 shadow-card hover:-translate-y-1 transition-transform"
            >
              <div className="size-10 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center mb-3">
                {f.icon}
              </div>
              <div className="font-semibold">{f.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Accessibility section */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-16">
        <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">Built for everyone</div>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 leading-tight">
              Accessibility isn't a checkbox.<br />It's the foundation.
            </h2>
            <p className="mt-4 opacity-90">
              Read-aloud on every panel. High-contrast theme. Larger text. Voice commands.
              Keyboard navigation. Designed with students who use screen readers from day one.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Read any notes, quiz, or answer aloud",
              "Cycle through Light / Dark / High-Contrast",
              "Three text-size presets, saved across sessions",
              "Voice navigation — say 'open quiz' or 'flashcards'",
              "Diagrams and charts described in plain English",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <FiCheckCircle className="mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Ready to learn anything?
        </h2>
        <p className="text-muted-foreground mt-3">
          No account needed. Drop a PDF and the AI takes it from there.
        </p>
        <Link
          to="/app"
          className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-medium shadow-card hover:opacity-95 transition"
        >
          Launch Study Buddy <FiArrowRight />
        </Link>
      </section>

      <footer className="max-w-6xl mx-auto px-5 md:px-8 py-10 text-center text-sm text-muted-foreground">
        Made with ♥ for accessible learning.
      </footer>
    </div>
  );
}
