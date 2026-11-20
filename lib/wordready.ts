import { filterClassWords } from "./class-words";
import {
  blankSentenceFor,
  normalizeWord,
  wordContextFor,
  type WordContexts,
} from "./word-context";

export { normalizeWord } from "./word-context";

export type PracticeMode = "sentences" | "fill" | "unscramble" | "mixed" | "mock";

export type FeedbackStatus = "correct" | "missed";

export type PracticeItem = {
  id: string;
  word: string;
  type: PracticeMode;
  prompt: string;
  helper?: string;
};

export type PlanItem = {
  day: string;
  daysLeft: number;
  label: string;
  mode: PracticeMode;
};

export type DashboardStats = {
  wordsToLearn: number;
  wordsMastered: number;
  dayStreak: number;
  accuracy: number;
};

export const STORAGE_KEYS = {
  name: "wordready.name",
  words: "wordready.words",
  days: "wordready.days",
  tricky: "wordready.tricky",
  mastered: "wordready.mastered",
} as const;

export const SAMPLE_WORDS = [
  "Tomorrow",
  "Window",
  "Bookshelf",
  "Fireplace",
  "Television",
  "Headphones",
  "Streetlight",
  "Sidewalk",
  "Picture",
  "Staircase",
];

export const PRACTICE_MODES: Array<{ id: PracticeMode; label: string }> = [
  { id: "sentences", label: "Sentences" },
  { id: "fill", label: "Fill Blanks" },
  { id: "unscramble", label: "Unscramble" },
  { id: "mixed", label: "Mixed Review" },
  { id: "mock", label: "Mock Test" },
];

export const MIN_DAYS = 1;
export const MAX_DAYS = 10;

export function boundNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeAnswer(word: string) {
  return word.trim().toLowerCase().replace(/[\s-]+/g, "");
}

export function parseWords(text: string) {
  const seen = new Set<string>();

  return filterClassWords(text).words
    .filter((word) => {
      const normalized = normalizeWord(word);

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

export function scrambleWord(word: string) {
  const clean = word.replace(/\s+/g, "");
  const letters = Array.from(clean);

  if (letters.length < 2) {
    return clean;
  }

  const seed = Array.from(clean).reduce((total, char) => total + char.charCodeAt(0), 0);

  for (let index = letters.length - 1; index > 0; index -= 1) {
    const swapIndex = (seed + index * 7) % (index + 1);
    [letters[index], letters[swapIndex]] = [letters[swapIndex], letters[index]];
  }

  const scrambled = letters.join("");

  if (normalizeAnswer(scrambled) === normalizeAnswer(clean)) {
    return letters.reverse().join("");
  }

  return scrambled;
}

export function buildPracticeItems(mode: PracticeMode, words: string[], contexts?: WordContexts) {
  return words.map((word, index): PracticeItem => {
    const mixedType = index % 2 === 0 ? "fill" : "unscramble";
    const itemType = mode === "mixed" ? mixedType : mode;
    const isUnscramble = itemType === "unscramble";
    const context = wordContextFor(word, contexts);
    const sentence = mode === "sentences" ? context.text : blankSentenceFor(word, context);

    return {
      id: `${mode}-${normalizeWord(word)}-${index}`,
      word,
      type: itemType,
      prompt: isUnscramble ? scrambleWord(word) : sentence,
      helper: isUnscramble ? sentence : undefined,
    };
  });
}

export function buildPlan(daysUntilTest: number) {
  const days = boundNumber(daysUntilTest, MIN_DAYS, MAX_DAYS);
  const reviewModes: PracticeMode[] = ["sentences", "fill", "unscramble", "mixed", "mock"];

  return Array.from({ length: days }, (_, index): PlanItem => {
    const isLast = index === days - 1;
    const mode = isLast ? "mock" : reviewModes[index % (reviewModes.length - 1)];

    return {
      day: index === 0 ? "Today" : isLast ? "Test Day" : `Day ${index + 1}`,
      daysLeft: days - index,
      label: PRACTICE_MODES.find((item) => item.id === mode)?.label ?? "Review",
      mode,
    };
  });
}

export function countMatchingWords(words: string[], keys: Set<string>) {
  return words.filter((word) => keys.has(normalizeWord(word))).length;
}

export function calculateDashboardStats({
  correctAnswers,
  masteredKeys,
  totalAnswers,
  words,
}: {
  correctAnswers: number;
  masteredKeys: Set<string>;
  totalAnswers: number;
  words: string[];
}): DashboardStats {
  const wordsMastered = countMatchingWords(words, masteredKeys);
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return {
    wordsToLearn: words.length,
    wordsMastered,
    dayStreak: words.length > 0 ? Math.min(wordsMastered, 7) : 0,
    accuracy,
  };
}
