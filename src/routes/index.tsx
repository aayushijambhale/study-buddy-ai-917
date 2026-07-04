import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Buddy — Editorial AI study, accessible to all" },
      {
        name: "description",
        content:
          "Turn any PDF into smart notes, quizzes, flashcards, mind maps, and a voice tutor — designed accessibility-first in a calm editorial workspace.",
      },
      { property: "og:title", content: "Study Buddy — Editorial AI study workspace" },
      {
        property: "og:description",
        content:
          "AI notes, quizzes, flashcards, mind maps, voice tutor and collaborative rooms. Accessibility-first.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    ref: "01",
    title: "Smart Notes",
    desc: "AI-synthesized summaries that distill dense chapters into clear, cited insights.",
    render: () => (
      <div className="w-full h-40 bg-background/60 border border-accent/15 p-4 space-y-2">
        <div className="h-2 bg-primary/25 w-3/4 rounded-sm" />
        <div className="h-2 bg-primary/15 w-1/2 rounded-sm" />
        <div className="h-2 bg-primary/15 w-5/6 rounded-sm" />
        <div className="h-2 bg-accent/40 w-1/3 rounded-sm mt-6" />
        <div className="h-2 bg-primary/10 w-2/3 rounded-sm" />
      </div>
    ),
  },
  {
    ref: "02",
    title: "Auto Quiz",
    desc: "MCQ, true/false, and short answers — each tied back to the exact source page.",
    render: () => (
      <div className="w-full h-40 grid place-items-center">
        <div className="font-serif text-7xl text-accent/30 italic leading-none">Q&amp;A</div>
      </div>
    ),
  },
  {
    ref: "03",
    title: "Flashcards",
    desc: "Spaced-repetition decks with SM-2 scheduling and streaks that actually stick.",
    render: () => (
      <div className="w-full h-40 relative">
        <div className="absolute inset-x-6 top-6 h-28 bg-background border border-accent/20 rotate-[-3deg] shadow-sm" />
        <div className="absolute inset-x-6 top-4 h-28 bg-card border border-accent/30 rotate-[2deg] shadow-sm grid place-items-center">
          <span className="font-serif italic text-2xl text-primary">Hückel's rule</span>
        </div>
      </div>
    ),
  },
  {
    ref: "04",
    title: "Study Planner",
    desc: "Day-by-day plan from your exam date, with Pomodoro focus built in.",
    render: () => (
      <div className="w-full h-40 grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm ${
              i % 5 === 0 ? "bg-accent" : i % 3 === 0 ? "bg-primary/60" : "bg-primary/15"
            }`}
          />
        ))}
      </div>
    ),
  },
  {
    ref: "05",
    title: "Image Description",
    desc: "Diagrams, plots, and charts narrated aloud for low-vision learners.",
    render: () => (
      <div className="w-full h-40 border border-accent/20 p-4 flex flex-col gap-3">
        <div className="flex-1 flex items-end gap-2">
          <div className="w-3 bg-primary/30 h-1/3" />
          <div className="w-3 bg-primary/50 h-2/3" />
          <div className="w-3 bg-primary h-full" />
          <div className="w-3 bg-primary/60 h-1/2" />
          <div className="w-3 bg-accent h-3/4" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          "A rising trend, peaking at column three."
        </div>
      </div>
    ),
  },
  {
    ref: "06",
    title: "Voice Tutor",
    desc: "Speak your question, hear the answer — cited to the exact page you uploaded.",
    render: () => (
      <div className="w-full h-40 grid place-items-center">
        <div className="flex items-end gap-1 h-16">
          {[6, 14, 8, 20, 12, 26, 10, 18, 8, 14, 6].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-primary rounded-full"
              style={{ height: `${h * 3}px` }}
            />
          ))}
        </div>
      </div>
    ),
  },
];

const manifesto = [
  "Screen-reader first architecture",
  "High-contrast semantic color sets",
  "Low-latency voice interaction",
  "Full keyboard navigation paths",
  "Simplified cognitive UI modes",
];

const chips = ["Read aloud", "Voice nav", "High-contrast", "Keyboard focus"];

function Landing() {
  return (
    <div className="bg-background text-foreground w-full selection:bg-accent/30">
      {/* Masthead */}
      <nav className="border-b border-accent/30 px-6 md:px-10 py-4 flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Link
          to="/"
          className="font-serif text-3xl italic text-primary tracking-tight leading-none"
        >
          Study Buddy
        </Link>
        <div className="flex items-center gap-4 md:gap-10 text-xs font-medium uppercase tracking-[0.2em]">
          <Link
            to="/rooms"
            className="hidden sm:inline text-primary hover:text-accent transition-colors"
          >
            Study rooms
          </Link>
          <Link
            to="/app"
            className="bg-primary text-primary-foreground px-5 md:px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm"
          >
            Launch app
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Hero */}
        <section className="pt-16 md:pt-24 pb-16 grid grid-cols-12 gap-8 border-b border-accent/20">
          <div className="col-span-12 lg:col-span-8">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-accent text-xs font-semibold uppercase tracking-[0.3em] mb-6"
            >
              AI · Accessibility · Education
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.92] text-primary mb-8"
            >
              Learn smarter.
              <br />
              <span className="italic">Accessible</span> to all.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-2xl text-primary/80 max-w-2xl leading-relaxed mb-10 font-light"
            >
              Transform any PDF into interactive notes, adaptive quizzes, and
              high-fidelity voice tutoring. Designed for every learner, built for
              every ability.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/app"
                className="bg-primary text-primary-foreground px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary/90 transition-all"
              >
                Start studying
              </Link>
              <a
                href="#features"
                className="border border-primary text-primary px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all"
              >
                See features
              </a>
            </motion.div>
          </div>

          {/* Editorial Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-4 flex flex-col justify-end"
          >
            <div className="p-8 bg-card border border-accent/25 shadow-card lg:translate-y-12">
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Metric 01
                </span>
                <div className="w-12 h-0.5 bg-accent" />
              </div>
              <div className="font-serif text-5xl mb-2 text-primary">94%</div>
              <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold">
                Retention Score
              </p>
              <div className="mt-8 pt-8 border-t border-accent/20 italic font-serif text-lg text-primary/80 leading-snug">
                "The voice tutor turned my commute into a dynamic lecture hall."
              </div>
              <div className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
                — Field note, medical student
              </div>
            </div>
          </motion.div>
        </section>

        {/* Chip row */}
        <div className="py-8 border-b border-accent/20 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-10 md:gap-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent shrink-0">
              Built in
            </span>
            <div className="flex items-center gap-8">
              {chips.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="py-24">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif text-4xl md:text-6xl text-primary leading-none">
              The Toolkit
            </h2>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent hidden sm:block">
              Six core utilities
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-accent/20">
            {features.map((f) => (
              <div
                key={f.ref}
                className="p-8 md:p-10 border-r border-b border-accent/20 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <div className="font-serif text-3xl text-primary">{f.title}</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    Ref. {f.ref}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/70 mb-8">{f.desc}</p>
                {f.render()}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Manifesto band — full bleed */}
      <section className="bg-primary text-primary-foreground overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-24">
          <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-accent mb-6 text-center">
            The Manifesto
          </span>
          <h2 className="font-serif text-4xl md:text-6xl italic mb-14 text-center leading-tight">
            Accessibility is the foundation, not a checkbox.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 border-t border-primary-foreground/20 pt-12">
            {manifesto.map((m, i) => (
              <div key={m} className="flex items-start gap-5">
                <span className="text-accent text-xs font-bold pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-lg md:text-xl font-light leading-snug">{m}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-20 -bottom-24 opacity-[0.06] pointer-events-none select-none">
          <div className="font-serif text-[24rem] leading-none">SB</div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-28 md:py-36 text-center">
        <h2 className="font-serif text-5xl md:text-7xl text-primary mb-12 italic leading-tight">
          Ready to redefine <br className="hidden sm:block" />
          your study flow?
        </h2>
        <Link
          to="/app"
          className="inline-block border-2 border-primary text-primary px-10 md:px-14 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-all"
        >
          Open the App
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-accent/30 px-6 md:px-10 py-12 bg-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          <div>
            <div className="font-serif text-3xl italic text-primary mb-3">Study Buddy</div>
            <p className="text-[11px] text-foreground/50 uppercase tracking-widest leading-loose">
              The editorial study workspace.
              <br />© {new Date().getFullYear()} Made for accessible learning.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:gap-16">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-5">
                Product
              </div>
              <ul className="text-xs space-y-3 font-medium text-primary">
                <li>
                  <Link to="/app" className="hover:text-accent transition-colors">
                    Launch app
                  </Link>
                </li>
                <li>
                  <Link to="/rooms" className="hover:text-accent transition-colors">
                    Study rooms
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-accent transition-colors">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-5">
                Connect
              </div>
              <ul className="text-xs space-y-3 font-medium text-primary">
                <li>
                  <Link to="/auth" className="hover:text-accent transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Journal
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
