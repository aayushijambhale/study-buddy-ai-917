export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
}

export interface GamificationState {
  xp: number;
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  weeklyGoal: number;    // minutes/week
  weeklyMinutes: number;
  weekStart: string;     // YYYY-MM-DD (Mon)
}

export const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0,
  streak: 0,
  lastActiveDay: "",
  weeklyGoal: 180,
  weeklyMinutes: 0,
  weekStart: "",
};

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function mondayKey(d = new Date()) {
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return todayKey(monday);
}

export function tickActivity(state: GamificationState): GamificationState {
  const today = todayKey();
  const week = mondayKey();
  let streak = state.streak;
  if (state.lastActiveDay !== today) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    streak = state.lastActiveDay === todayKey(y) ? streak + 1 : 1;
  }
  const weeklyMinutes = state.weekStart === week ? state.weeklyMinutes : 0;
  return { ...state, lastActiveDay: today, streak, weeklyMinutes, weekStart: week };
}

export function addXp(state: GamificationState, amount: number): GamificationState {
  return { ...tickActivity(state), xp: state.xp + amount };
}

export function addStudyMinutes(state: GamificationState, mins: number): GamificationState {
  const ticked = tickActivity(state);
  return { ...ticked, weeklyMinutes: ticked.weeklyMinutes + mins, xp: ticked.xp + mins * 2 };
}

export function level(xp: number) {
  // 100 xp per level, soft curve
  const lvl = Math.floor(Math.sqrt(xp / 50)) + 1;
  const nextXp = ((lvl) ** 2) * 50;
  const prevXp = ((lvl - 1) ** 2) * 50;
  return { level: lvl, prevXp, nextXp, progress: (xp - prevXp) / Math.max(1, nextXp - prevXp) };
}

export function computeBadges(opts: {
  state: GamificationState;
  notes: number;
  quizzes: number;
  flashcards: number;
  images: number;
  voiceCommands: number;
  mindMaps: number;
}): Badge[] {
  const b = (id: string, name: string, description: string, emoji: string, earned: boolean): Badge => ({
    id, name, description, emoji, earned,
  });
  return [
    b("first-steps", "First Steps", "Earn your first XP", "🌱", opts.state.xp > 0),
    b("note-taker", "Note Taker", "Generate 3 sets of notes", "📓", opts.notes >= 3),
    b("quiz-master", "Quiz Master", "Generate 3 quizzes", "🧠", opts.quizzes >= 3),
    b("deck-builder", "Deck Builder", "Create 20+ flashcards", "🃏", opts.flashcards >= 20),
    b("voice-pilot", "Voice Pilot", "Use 5 voice commands", "🎙️", opts.voiceCommands >= 5),
    b("vision-pro", "Vision Pro", "Describe 3 images", "👁️", opts.images >= 3),
    b("mind-mapper", "Mind Mapper", "Generate a mind map", "🕸️", opts.mindMaps >= 1),
    b("streak-3", "On a Roll", "3-day streak", "🔥", opts.state.streak >= 3),
    b("streak-7", "Week Warrior", "7-day streak", "⚡", opts.state.streak >= 7),
    b("focused", "Focused", "Hit your weekly goal", "🎯", opts.state.weeklyMinutes >= opts.state.weeklyGoal),
  ];
}
