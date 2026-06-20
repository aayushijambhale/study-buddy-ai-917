// SM-2 spaced repetition algorithm.
// Quality scale: 0 Again, 3 Hard, 4 Good, 5 Easy.

export interface SM2State {
  ease: number;      // E-factor
  interval: number;  // days
  reps: number;
  due: number;       // unix ms
  lapses: number;
}

export function initialSM2(): SM2State {
  return { ease: 2.5, interval: 0, reps: 0, due: Date.now(), lapses: 0 };
}

export function reviewSM2(state: SM2State, quality: 0 | 3 | 4 | 5): SM2State {
  const now = Date.now();
  let { ease, interval, reps, lapses } = state;

  if (quality < 3) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.round(interval * ease);
    reps += 1;
  }

  ease = Math.max(
    1.3,
    ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const due = now + interval * 24 * 60 * 60 * 1000;
  return { ease, interval, reps, due, lapses };
}

export function isDue(state: SM2State, now = Date.now()) {
  return state.due <= now;
}

export function dueLabel(state: SM2State, now = Date.now()): string {
  if (state.reps === 0) return "New";
  const diff = state.due - now;
  if (diff <= 0) return "Due now";
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return days === 1 ? "1 day" : `${days} days`;
}
