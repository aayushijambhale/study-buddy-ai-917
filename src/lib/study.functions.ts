import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";
const VISION_MODEL = "google/gemini-2.5-flash";

function getModel(name: string = MODEL) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(name);
}

function trimContext(text: string, max = 60_000) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[...truncated...]";
}

function tryParseJson<T = unknown>(raw: string): T | null {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  const start =
    first === -1 ? firstArr : firstArr === -1 ? first : Math.min(first, firstArr);
  if (start === -1) return null;
  const lastObj = cleaned.lastIndexOf("}");
  const lastArr = cleaned.lastIndexOf("]");
  const end = Math.max(lastObj, lastArr);
  if (end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/* -------------------- Notes -------------------- */

export const generateNotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ text: z.string().min(20), pdfName: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = `You are an expert study assistant. Read the following study material and produce a clean, well-structured Markdown study guide for a student preparing for an exam.

Include:
1. **Chapter Summary** – a 5-bullet executive summary.
2. **Key Concepts & Definitions** – bullet list, bold the term.
3. **Important Formulas / Facts** – if any.
4. **Exam Revision Notes** – the 10 most important takeaways as a numbered list.
5. **Exam Tips** – 3 short pieces of advice.

Use clear headings (##), keep prose tight, and avoid filler.

---
STUDY MATERIAL:
${trimContext(data.text)}`;

    const { text } = await generateText({ model: getModel(), prompt });
    return { notes: text };
  });

/* -------------------- Quiz -------------------- */

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(20) }).parse(d))
  .handler(async ({ data }) => {
    const prompt = `Create a quiz from the study material below. The material is split into sections marked "--- Page N ---" — use those numbers to cite where each question comes from.

Return ONLY valid JSON with this exact shape — no commentary, no markdown fences:

{
  "mcq": [ { "question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "...", "sourcePage": 1 } ],
  "trueFalse": [ { "question": "...", "answer": "True", "explanation": "...", "sourcePage": 1 } ],
  "short": [ { "question": "...", "answer": "...", "explanation": "...", "sourcePage": 1 } ]
}

Rules:
- mcq: 10 questions, 4 options each, "answer" is one of the option strings (verbatim).
- trueFalse: 10 questions, "answer" is "True" or "False".
- short: 5 questions with concise model answers.
- "sourcePage" MUST be an integer matching the page where the answer is found.
- Every question must be answerable from the material.

STUDY MATERIAL:
${trimContext(data.text, 50_000)}`;

    const { text } = await generateText({ model: getModel(), prompt });
    type QuizShape = {
      mcq: { question: string; options: string[]; answer: string; explanation: string; sourcePage?: number }[];
      trueFalse: { question: string; answer: string; explanation: string; sourcePage?: number }[];
      short: { question: string; answer: string; explanation: string; sourcePage?: number }[];
    };
    const parsed = tryParseJson<QuizShape>(text);
    if (!parsed) throw new Error("Quiz generation failed: could not parse model output.");
    return {
      mcq: Array.isArray(parsed.mcq) ? parsed.mcq : [],
      trueFalse: Array.isArray(parsed.trueFalse) ? parsed.trueFalse : [],
      short: Array.isArray(parsed.short) ? parsed.short : [],
    };
  });

/* -------------------- Simplify -------------------- */

export const simplify = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(5) }).parse(d))
  .handler(async ({ data }) => {
    const prompt = `Explain the following content as if teaching a curious 15-year-old. Use:
- simple, everyday language
- a relatable real-world analogy
- a short step-by-step breakdown

Keep it under 250 words. Use Markdown.

CONTENT:
${data.text}`;
    const { text } = await generateText({ model: getModel(), prompt });
    return { explanation: text };
  });

/* -------------------- Ask PDF -------------------- */

export const askPdf = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        text: z.string().min(20),
        question: z.string().min(2),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const history = (data.history ?? [])
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `You are a study tutor. Answer the student's question using ONLY the document below.
- The document is split into sections marked "--- Page N ---".
- If the answer is not in the document, say so plainly.
- Inline citation: whenever you state a fact, append [p.N] (or [p.3,5] for multi).
- Keep answers focused. Use Markdown.

DOCUMENT:
${trimContext(data.text, 55_000)}

${history ? `CONVERSATION SO FAR:\n${history}\n` : ""}
STUDENT QUESTION: ${data.question}`;

    const { text } = await generateText({ model: getModel(), prompt });
    return { answer: text };
  });

/* -------------------- Flashcards -------------------- */

export const generateFlashcards = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(20) }).parse(d))
  .handler(async ({ data }) => {
    const prompt = `Create 12 high-quality study flashcards from the material below.

Return ONLY valid JSON, no fences, no commentary:
{ "cards": [ { "front": "Term or question", "back": "Concise definition or answer (1-3 sentences)" } ] }

Rules:
- Mix definitions, key concepts, and 'why does this matter' style cards.
- Front side: short prompt (term or question). Back: focused answer.
- All content must be answerable from the material.

MATERIAL:
${trimContext(data.text, 45_000)}`;
    const { text } = await generateText({ model: getModel(), prompt });
    const parsed = tryParseJson<{ cards: { front: string; back: string }[] }>(text);
    if (!parsed?.cards) throw new Error("Flashcard generation failed.");
    return { cards: parsed.cards.filter((c) => c.front && c.back) };
  });

/* -------------------- Study Plan -------------------- */

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        examDate: z.string().min(4),
        chapters: z.string().min(2),
        dailyHours: z.number().min(0.5).max(16),
        context: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `You are an academic coach. Build a realistic day-by-day study plan.

Today's date: ${today}
Exam date: ${data.examDate}
Daily study hours available: ${data.dailyHours}
Chapters / topics remaining:
${data.chapters}

${data.context ? `Optional context from the student's PDF:\n${trimContext(data.context, 8_000)}\n` : ""}

Return ONLY valid JSON, no fences:
{
  "overview": "1-2 sentence strategy",
  "totalDays": <int>,
  "days": [
    { "day": 1, "date": "YYYY-MM-DD", "focus": "Headline of the day", "tasks": ["task 1", "task 2"] }
  ]
}

Rules:
- Spread chapters across the available days proportionally to weight.
- Reserve the LAST 1-2 days for full revision + mock test.
- Each day must have 2-5 concrete tasks sized for the available hours.
- Do not exceed dailyHours.`;

    const { text } = await generateText({ model: getModel(), prompt });
    const parsed = tryParseJson<{
      overview: string;
      totalDays: number;
      days: { day: number; date?: string; focus: string; tasks: string[] }[];
    }>(text);
    if (!parsed?.days) throw new Error("Study plan generation failed.");
    return {
      overview: parsed.overview ?? "",
      totalDays: parsed.totalDays ?? parsed.days.length,
      days: parsed.days,
    };
  });

/* -------------------- Image description (Vision) -------------------- */

export const describeImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        dataUrl: z.string().startsWith("data:image/"),
        prompt: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const instruction =
      data.prompt ??
      `Describe this image for a visually impaired student. Cover:

1. **Overview** — one sentence: what is this image?
2. **Layout & Objects** — what is positioned where (top/bottom/left/right/center).
3. **Important Information** — any text labels, numbers, arrows, or annotations, read verbatim.
4. **Educational Context** — if it's a diagram, explain what concept it illustrates and how the parts relate.

Use clear, calm prose with short paragraphs. Avoid filler. Use Markdown.`;

    const { text } = await generateText({
      model: getModel(VISION_MODEL),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image", image: data.dataUrl },
          ],
        },
      ],
    });
    return { description: text };
  });
