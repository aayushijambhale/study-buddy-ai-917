import { useCallback, useEffect, useRef, useState } from "react";

type SR = typeof window extends { SpeechRecognition: infer T } ? T : unknown;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: (e: unknown) => void;
}

export function useSpeechRecognition(lang = "en-US") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
  }, [lang]);

  const supported = typeof window !== "undefined" &&
    !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
       (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setTranscript("");
    try { recRef.current.start(); setListening(true); } catch { /* already started */ }
  }, []);
  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, transcript, start, stop, setTranscript };
}

export function speak(text: string, lang?: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  if (lang) {
    u.lang = lang;
    // Try to pick a matching voice
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (match) u.voice = match;
  }
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
