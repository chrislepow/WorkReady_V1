export type PracticeMode = "sentences" | "fill" | "unscramble" | "mixed" | "mock";

export type FeedbackStatus = "correct" | "missed";

export type PracticeItem = {
  id: string;
  word: string;
  type: Exclude<PracticeMode, "sentences">;
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

export function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeAnswer(word: string) {
  return word.trim().toLowerCase().replace(/[\s-]+/g, "");
}

export function parseWords(text: string) {
  const seen = new Set<string>();

  return text
    .split(/[\n,]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => {
      const normalized = normalizeWord(word);

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

export function sentenceFor(word: string, index: number) {
  const sentenceWord = word.toLowerCase();
  const templates = [
    `The weather tomorrow will be rainy.`,
    `There is one window open in the house.`,
    `I have one bookshelf at home with a lot of books.`,
    `It is comfortable to sit by the fireplace during the winter.`,
    `Our television is on the wall in our house.`,
    `The headphones fit neatly inside the backpack.`,
    `The streetlight turns on when the evening gets dark.`,
    `We walked along the sidewalk after school.`,
  ];

  if (templates[index]) {
    return templates[index].replace(
      /\b(tomorrow|window|bookshelf|fireplace|television|headphones|streetlight|sidewalk)\b/i,
      sentenceWord,
    );
  }

  return `The class practiced ${sentenceWord} before the spelling test.`;
}

export function blankSentenceFor(word: string, index: number) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return sentenceFor(word, index).replace(new RegExp(escaped, "i"), "_____");
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

export function buildPracticeItems(mode: PracticeMode, words: string[]) {
  if (mode === "sentences") {
    return [];
  }

  return words.map((word, index): PracticeItem => {
    const mixedType = index % 2 === 0 ? "fill" : "unscramble";
    const itemType = mode === "mixed" ? mixedType : mode;
    const isUnscramble = itemType === "unscramble";

    return {
      id: `${mode}-${normalizeWord(word)}-${index}`,
      word,
      type: itemType,
      prompt: isUnscramble ? scrambleWord(word) : blankSentenceFor(word, index),
      helper: isUnscramble ? blankSentenceFor(word, index) : undefined,
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
