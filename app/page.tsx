"use client";

import {
  AlertCircle,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Eraser,
  Minus,
  PencilLine,
  Plus,
  RotateCcw,
  Shuffle,
  SpellCheck,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StudyMode = "sentences" | "fill" | "unscramble" | "mixed" | "mock" | "missed";
type Feedback = "correct" | "missed";
type PracticeSource = "all" | "missed";

type MissedWord = {
  word: string;
  count: number;
  lastMissed: number;
};

type PracticeItem = {
  id: string;
  word: string;
  type: Exclude<StudyMode, "sentences" | "missed">;
  prompt: string;
  helper?: string;
};

type PlanItem = {
  day: string;
  label: string;
  mode: StudyMode;
  accent: string;
};

const WORDS_KEY = "wordready.words";
const DAYS_KEY = "wordready.days";
const MISSED_KEY = "wordready.missed";

const STARTER_WORDS = [
  "because",
  "friend",
  "library",
  "answer",
  "different",
  "sentence",
  "tomorrow",
  "beautiful",
];

const MODE_META: Record<
  StudyMode,
  {
    label: string;
    icon: typeof BookOpenText;
    accent: string;
    soft: string;
  }
> = {
  sentences: {
    label: "Sentences",
    icon: BookOpenText,
    accent: "text-[#2f80ed]",
    soft: "bg-[#eaf3ff] border-[#b9d8ff]",
  },
  fill: {
    label: "Fill blanks",
    icon: PencilLine,
    accent: "text-[#2d9c68]",
    soft: "bg-[#eaf8f1] border-[#bde4cd]",
  },
  unscramble: {
    label: "Unscramble",
    icon: Shuffle,
    accent: "text-[#8a4fff]",
    soft: "bg-[#f0ebff] border-[#d2c4ff]",
  },
  mixed: {
    label: "Mixed review",
    icon: SpellCheck,
    accent: "text-[#d55d2d]",
    soft: "bg-[#fff0e8] border-[#ffcdb7]",
  },
  mock: {
    label: "Mock test",
    icon: ClipboardCheck,
    accent: "text-[#117a7a]",
    soft: "bg-[#e5f8f6] border-[#aee2dd]",
  },
  missed: {
    label: "Missed words",
    icon: AlertCircle,
    accent: "text-[#c74343]",
    soft: "bg-[#fff0f0] border-[#ffc9c9]",
  },
};

const PLAN_SEQUENCE: Array<Omit<PlanItem, "day">> = [
  {
    label: "See and say",
    mode: "sentences",
    accent: "border-l-[#2f80ed]",
  },
  {
    label: "Fill blanks",
    mode: "fill",
    accent: "border-l-[#2d9c68]",
  },
  {
    label: "Unscramble",
    mode: "unscramble",
    accent: "border-l-[#8a4fff]",
  },
  {
    label: "Mixed review",
    mode: "mixed",
    accent: "border-l-[#d55d2d]",
  },
  {
    label: "Mock test",
    mode: "mock",
    accent: "border-l-[#117a7a]",
  },
  {
    label: "Missed words",
    mode: "missed",
    accent: "border-l-[#c74343]",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeAnswer(word: string) {
  return word.trim().toLowerCase().replace(/[\s-]+/g, "");
}

function parseWords(text: string) {
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

function sentenceFor(word: string, index: number) {
  const templates = [
    `The class practiced ${word} before the spelling test.`,
    `Maya wrote ${word} neatly on her study card.`,
    `Jordan used ${word} in a sentence after lunch.`,
    `The teacher circled ${word} on the review sheet.`,
  ];

  return templates[index % templates.length];
}

function blankSentenceFor(word: string, index: number) {
  return sentenceFor(word, index).replace(word, "_____");
}

function scrambleWord(word: string) {
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

function buildPlan(daysUntilTest: number): PlanItem[] {
  return Array.from({ length: daysUntilTest }, (_, index) => {
    const isFirst = index === 0;
    const isLast = index === daysUntilTest - 1;
    const isPenultimate = index === daysUntilTest - 2;
    let base = PLAN_SEQUENCE[index % 4];

    if (isLast) {
      base = PLAN_SEQUENCE[4];
    } else if (isPenultimate && daysUntilTest > 2) {
      base = PLAN_SEQUENCE[3];
    } else if (daysUntilTest > 4 && index === daysUntilTest - 3) {
      base = PLAN_SEQUENCE[5];
    }

    return {
      ...base,
      day: isFirst ? "Today" : isLast ? "Test day" : `Day ${index + 1}`,
    };
  });
}

function buildPracticeItems(mode: StudyMode, activeWords: string[]) {
  if (mode === "sentences" || mode === "missed") {
    return [];
  }

  return activeWords.map((word, index): PracticeItem => {
    if (mode === "unscramble") {
      return {
        id: `${mode}-${normalizeWord(word)}-${index}`,
        word,
        type: "unscramble",
        prompt: scrambleWord(word),
        helper: blankSentenceFor(word, index),
      };
    }

    if (mode === "mock") {
      return {
        id: `${mode}-${normalizeWord(word)}-${index}`,
        word,
        type: "mock",
        prompt: blankSentenceFor(word, index),
      };
    }

    if (mode === "mixed") {
      const type = index % 2 === 0 ? "fill" : "unscramble";

      return {
        id: `${mode}-${normalizeWord(word)}-${index}`,
        word,
        type,
        prompt: type === "fill" ? blankSentenceFor(word, index) : scrambleWord(word),
        helper: type === "unscramble" ? blankSentenceFor(word, index) : undefined,
      };
    }

    return {
      id: `${mode}-${normalizeWord(word)}-${index}`,
      word,
      type: "fill",
      prompt: blankSentenceFor(word, index),
    };
  });
}

function formatMissedTime(value: number) {
  if (!value) {
    return "new";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(value);
}

export default function Home() {
  const [wordText, setWordText] = useState(STARTER_WORDS.join("\n"));
  const [daysUntilTest, setDaysUntilTest] = useState(5);
  const [mode, setMode] = useState<StudyMode>("sentences");
  const [practiceSource, setPracticeSource] = useState<PracticeSource>("all");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [missedWords, setMissedWords] = useState<MissedWord[]>([]);
  const [isReady, setIsReady] = useState(false);

  const words = useMemo(() => parseWords(wordText), [wordText]);
  const plan = useMemo(() => buildPlan(daysUntilTest), [daysUntilTest]);
  const activePracticeWords = useMemo(
    () =>
      practiceSource === "missed"
        ? missedWords.map((item) => item.word)
        : words,
    [missedWords, practiceSource, words],
  );
  const practiceItems = useMemo(
    () => buildPracticeItems(mode, activePracticeWords),
    [activePracticeWords, mode],
  );
  const correctCount = Object.values(feedback).filter((status) => status === "correct").length;
  const missedCount = Object.values(feedback).filter((status) => status === "missed").length;
  const activeModeMeta = MODE_META[mode];
  const ActiveModeIcon = activeModeMeta.icon;
  const modeDescription =
    practiceSource === "missed" && mode !== "missed"
      ? "Practicing the missed-word bank."
      : mode === "mock"
        ? "Grade the test to save missed words."
        : mode === "missed"
          ? "Review words that need another pass."
          : "Practice results update the missed-word bank.";

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Browser-only localStorage hydration for saved study data. */
    const storedWords = window.localStorage.getItem(WORDS_KEY);
    const storedDays = window.localStorage.getItem(DAYS_KEY);
    const storedMissed = window.localStorage.getItem(MISSED_KEY);

    if (storedWords) {
      setWordText(storedWords);
    }

    if (storedDays) {
      setDaysUntilTest(clamp(Number(storedDays) || 5, 1, 14));
    }

    if (storedMissed) {
      try {
        const parsed = JSON.parse(storedMissed) as MissedWord[];
        setMissedWords(
          parsed.filter((item) => item.word && Number.isFinite(item.count)),
        );
      } catch {
        setMissedWords([]);
      }
    }

    setIsReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(WORDS_KEY, wordText);
  }, [isReady, wordText]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(DAYS_KEY, String(daysUntilTest));
  }, [daysUntilTest, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(MISSED_KEY, JSON.stringify(missedWords));
  }, [isReady, missedWords]);

  function setDays(nextValue: number) {
    setDaysUntilTest(clamp(nextValue, 1, 14));
  }

  function addMissed(nextWords: string[]) {
    if (nextWords.length === 0) {
      return;
    }

    const now = Date.now();

    setMissedWords((current) => {
      const bank = new Map(current.map((item) => [normalizeWord(item.word), item]));

      nextWords.forEach((word) => {
        const key = normalizeWord(word);
        const existing = bank.get(key);

        bank.set(key, {
          word: existing?.word ?? word,
          count: (existing?.count ?? 0) + 1,
          lastMissed: now,
        });
      });

      return Array.from(bank.values()).sort((a, b) => b.lastMissed - a.lastMissed);
    });
  }

  function removeMissed(word: string) {
    setMissedWords((current) =>
      current.filter((item) => normalizeWord(item.word) !== normalizeWord(word)),
    );
  }

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setFeedback((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function gradeItems() {
    const nextFeedback: Record<string, Feedback> = {};
    const misses: string[] = [];

    practiceItems.forEach((item) => {
      const isCorrect = normalizeAnswer(answers[item.id] ?? "") === normalizeAnswer(item.word);
      nextFeedback[item.id] = isCorrect ? "correct" : "missed";

      if (!isCorrect) {
        misses.push(item.word);
      }
    });

    setFeedback(nextFeedback);
    addMissed(misses);
  }

  function resetPractice() {
    setAnswers({});
    setFeedback({});
  }

  function switchMode(nextMode: StudyMode, source: PracticeSource = "all") {
    setMode(nextMode);
    setPracticeSource(source);
    setFeedback({});
  }

  const hasWords = words.length > 0;
  const canGrade = practiceItems.length > 0;

  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7fb]">
      <header className="flex flex-col gap-4 border-b border-[#d9dee8] bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1f2937] text-white">
              <Star aria-hidden="true" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">WordReady</p>
              <h1 className="text-2xl font-bold text-[#1f2937] sm:text-3xl">
                Spelling study planner
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <StatPill icon={BookOpenText} label={`${words.length} words`} />
          <StatPill icon={CalendarDays} label={`${daysUntilTest} days`} />
          <StatPill icon={AlertCircle} label={`${missedWords.length} missed`} tone="warn" />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row">
        <aside className="flex w-full flex-col gap-4 xl:max-w-[390px]">
          <section className="flex flex-col gap-4 rounded-lg border border-[#d9dee8] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1f2937]">Class words</h2>
                <p className="text-sm text-[#64748b]">One word per line or comma.</p>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#d9dee8] bg-white text-[#64748b] transition hover:border-[#c74343] hover:text-[#c74343]"
                onClick={() => setWordText("")}
                title="Clear words"
                type="button"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>

            <textarea
              className="min-h-52 w-full resize-y rounded-md border border-[#cbd5e1] bg-[#fbfcfe] p-3 text-base text-[#1f2937] shadow-inner"
              onChange={(event) => setWordText(event.target.value)}
              spellCheck={false}
              value={wordText}
            />

            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 rounded-md bg-[#1f2937] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#111827]"
                onClick={() => setWordText(STARTER_WORDS.join("\n"))}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
                Starter list
              </button>
              <button
                className="flex items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm font-semibold text-[#1f2937] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                onClick={() => addMissed(words)}
                type="button"
              >
                <Star aria-hidden="true" size={16} />
                Mark all tricky
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-[#d9dee8] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1f2937]">Test countdown</h2>
                <p className="text-sm text-[#64748b]">Plan adjusts from today to test day.</p>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-[#eaf8f1] px-3 py-2 text-sm font-bold text-[#1f7a54]">
                <CalendarDays aria-hidden="true" size={16} />
                {daysUntilTest}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#cbd5e1] bg-white text-[#1f2937] transition hover:border-[#2f80ed]"
                onClick={() => setDays(daysUntilTest - 1)}
                title="One fewer day"
                type="button"
              >
                <Minus aria-hidden="true" size={18} />
              </button>
              <input
                aria-label="Days until test"
                className="w-full accent-[#2d9c68]"
                max="14"
                min="1"
                onChange={(event) => setDays(Number(event.target.value))}
                type="range"
                value={daysUntilTest}
              />
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#cbd5e1] bg-white text-[#1f2937] transition hover:border-[#2f80ed]"
                onClick={() => setDays(daysUntilTest + 1)}
                title="One more day"
                type="button"
              >
                <Plus aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {plan.map((item) => {
                const Icon = MODE_META[item.mode].icon;

                return (
                  <button
                    className={`flex items-center justify-between gap-3 rounded-md border border-[#d9dee8] border-l-4 ${item.accent} bg-[#fbfcfe] px-3 py-3 text-left transition hover:border-r-[#2f80ed] hover:bg-white`}
                    key={`${item.day}-${item.label}`}
                    onClick={() => switchMode(item.mode)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-semibold uppercase text-[#64748b]">
                        {item.day}
                      </span>
                      <span className="truncate text-sm font-bold text-[#1f2937]">
                        {item.label}
                      </span>
                    </span>
                    <Icon
                      aria-hidden="true"
                      className={MODE_META[item.mode].accent}
                      size={18}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-lg border border-[#d9dee8] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-md border ${activeModeMeta.soft} ${activeModeMeta.accent}`}
                >
                  <ActiveModeIcon aria-hidden="true" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1f2937]">{activeModeMeta.label}</h2>
                  <p className="text-sm text-[#64748b]">{modeDescription}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(MODE_META) as StudyMode[]).map((modeKey) => {
                  const Icon = MODE_META[modeKey].icon;
                  const isActive = modeKey === mode;

                  return (
                    <button
                      className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                        isActive
                          ? "border-[#1f2937] bg-[#1f2937] text-white"
                          : "border-[#cbd5e1] bg-white text-[#475569] hover:border-[#2f80ed] hover:text-[#2f80ed]"
                      }`}
                      key={modeKey}
                      onClick={() => switchMode(modeKey)}
                      title={MODE_META[modeKey].label}
                      type="button"
                    >
                      <Icon aria-hidden="true" size={16} />
                      <span className="hidden sm:inline">{MODE_META[modeKey].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {!hasWords ? (
            <EmptyState
              actionLabel="Use starter list"
              icon={BookOpenText}
              message="Add classroom words to start a plan."
              onAction={() => setWordText(STARTER_WORDS.join("\n"))}
              title="No words yet"
            />
          ) : mode === "sentences" ? (
            <SentencePractice addMissed={addMissed} words={words} />
          ) : mode === "missed" ? (
            <MissedWordsPanel
              missedWords={missedWords}
              onClear={() => setMissedWords([])}
              onPracticeAll={() => switchMode("mixed")}
              onPracticeMissed={() => switchMode("mixed", "missed")}
              onRemove={removeMissed}
            />
          ) : (
            <PracticePanel
              answers={answers}
              canGrade={canGrade}
              correctCount={correctCount}
              feedback={feedback}
              items={practiceItems}
              missedCount={missedCount}
              mode={mode}
              onGrade={gradeItems}
              onReset={resetPractice}
              onUpdateAnswer={updateAnswer}
              practiceSource={practiceSource}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function StatPill({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: typeof BookOpenText;
  label: string;
  tone?: "default" | "warn";
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 font-semibold ${
        tone === "warn"
          ? "border-[#ffc9c9] bg-[#fff0f0] text-[#a63737]"
          : "border-[#d9dee8] bg-[#fbfcfe] text-[#475569]"
      }`}
    >
      <Icon aria-hidden="true" size={16} />
      {label}
    </div>
  );
}

function EmptyState({
  actionLabel,
  icon: Icon,
  message,
  onAction,
  title,
}: {
  actionLabel: string;
  icon: typeof BookOpenText;
  message: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#eaf3ff] text-[#2f80ed]">
        <Icon aria-hidden="true" size={26} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{message}</p>
      </div>
      <button
        className="flex items-center gap-2 rounded-md bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#111827]"
        onClick={onAction}
        type="button"
      >
        <Plus aria-hidden="true" size={16} />
        {actionLabel}
      </button>
    </div>
  );
}

function SentencePractice({
  addMissed,
  words,
}: {
  addMissed: (words: string[]) => void;
  words: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {words.map((word, index) => (
        <article
          className="flex flex-col gap-3 rounded-lg border border-[#d9dee8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          key={`${word}-${index}`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#eaf3ff] px-2 py-1 text-sm font-bold text-[#2f80ed]">
                {word}
              </span>
              <span className="text-xs font-semibold uppercase text-[#64748b]">
                Word {index + 1}
              </span>
            </div>
            <p className="mt-2 text-base text-[#1f2937]">{sentenceFor(word, index)}</p>
          </div>
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#475569] transition hover:border-[#c74343] hover:text-[#c74343] sm:shrink-0"
            onClick={() => addMissed([word])}
            type="button"
          >
            <AlertCircle aria-hidden="true" size={16} />
            Tricky
          </button>
        </article>
      ))}
    </div>
  );
}

function PracticePanel({
  answers,
  canGrade,
  correctCount,
  feedback,
  items,
  missedCount,
  mode,
  onGrade,
  onReset,
  onUpdateAnswer,
  practiceSource,
}: {
  answers: Record<string, string>;
  canGrade: boolean;
  correctCount: number;
  feedback: Record<string, Feedback>;
  items: PracticeItem[];
  missedCount: number;
  mode: StudyMode;
  onGrade: () => void;
  onReset: () => void;
  onUpdateAnswer: (id: string, value: string) => void;
  practiceSource: PracticeSource;
}) {
  const isMock = mode === "mock";
  const hasFeedback = Object.keys(feedback).length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[#d9dee8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <StatPill
            icon={BookOpenText}
            label={
              practiceSource === "missed"
                ? `${items.length} bank words`
                : `${items.length} words`
            }
          />
          <StatPill icon={CheckCircle2} label={`${correctCount} correct`} />
          <StatPill icon={AlertCircle} label={`${missedCount} missed`} tone="warn" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-10 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#475569] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
            onClick={onReset}
            type="button"
          >
            <Eraser aria-hidden="true" size={16} />
            Reset
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-[#1f2937] px-4 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
            disabled={!canGrade}
            onClick={onGrade}
            type="button"
          >
            <ClipboardCheck aria-hidden="true" size={16} />
            {isMock ? "Grade test" : "Check answers"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const status = feedback[item.id];

          return (
            <article
              className={`flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm ${
                status === "correct"
                  ? "border-[#bde4cd]"
                  : status === "missed"
                    ? "border-[#ffc9c9]"
                    : "border-[#d9dee8]"
              }`}
              key={item.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase text-[#64748b]">
                    {isMock ? `Test word ${index + 1}` : `Practice word ${index + 1}`}
                  </span>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      item.type === "unscramble" ? "text-[#8a4fff]" : "text-[#1f2937]"
                    }`}
                  >
                    {item.prompt}
                  </p>
                  {item.helper ? (
                    <p className="mt-1 text-sm text-[#64748b]">{item.helper}</p>
                  ) : null}
                </div>
                {status ? (
                  <ResultBadge status={status} />
                ) : (
                  <span className="rounded-md border border-[#d9dee8] px-2 py-1 text-xs font-semibold uppercase text-[#64748b]">
                    {item.type}
                  </span>
                )}
              </div>

              <input
                aria-label={`Answer for word ${index + 1}`}
                autoCapitalize="none"
                className="h-12 w-full rounded-md border border-[#cbd5e1] bg-[#fbfcfe] px-3 text-base text-[#1f2937]"
                onChange={(event) => onUpdateAnswer(item.id, event.target.value)}
                placeholder="Type the spelling word"
                spellCheck={false}
                value={answers[item.id] ?? ""}
              />

              {hasFeedback && status === "missed" ? (
                <p className="text-sm font-semibold text-[#a63737]">Answer: {item.word}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ResultBadge({ status }: { status: Feedback }) {
  const isCorrect = status === "correct";

  return (
    <span
      className={`flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-bold uppercase ${
        isCorrect
          ? "border-[#bde4cd] bg-[#eaf8f1] text-[#1f7a54]"
          : "border-[#ffc9c9] bg-[#fff0f0] text-[#a63737]"
      }`}
    >
      {isCorrect ? (
        <CheckCircle2 aria-hidden="true" size={14} />
      ) : (
        <AlertCircle aria-hidden="true" size={14} />
      )}
      {isCorrect ? "Correct" : "Missed"}
    </span>
  );
}

function MissedWordsPanel({
  missedWords,
  onClear,
  onPracticeAll,
  onPracticeMissed,
  onRemove,
}: {
  missedWords: MissedWord[];
  onClear: () => void;
  onPracticeAll: () => void;
  onPracticeMissed: () => void;
  onRemove: (word: string) => void;
}) {
  if (missedWords.length === 0) {
    return (
      <EmptyState
        actionLabel="Practice mixed review"
        icon={CheckCircle2}
        message="Missed words appear after a practice check or mock test."
        onAction={onPracticeAll}
        title="No missed words"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[#d9dee8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Study bank</h2>
          <p className="text-sm text-[#64748b]">Newest misses stay at the top.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-[#1f2937] px-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
            onClick={onPracticeMissed}
            type="button"
          >
            <Shuffle aria-hidden="true" size={16} />
            Practice bank
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-md border border-[#ffc9c9] bg-[#fff0f0] px-3 text-sm font-semibold text-[#a63737] transition hover:border-[#c74343]"
            onClick={onClear}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {missedWords.map((item) => (
          <article
            className="flex min-h-28 w-full flex-col justify-between gap-4 rounded-lg border border-[#ffc9c9] bg-white p-4 shadow-sm sm:w-[calc(50%-0.375rem)] 2xl:w-[calc(33.333%-0.5rem)]"
            key={normalizeWord(item.word)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold text-[#1f2937]">{item.word}</h3>
                <p className="mt-1 text-sm text-[#64748b]">
                  Missed {item.count} {item.count === 1 ? "time" : "times"} ·{" "}
                  {formatMissedTime(item.lastMissed)}
                </p>
              </div>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d9dee8] bg-white text-[#64748b] transition hover:border-[#2d9c68] hover:text-[#1f7a54]"
                onClick={() => onRemove(item.word)}
                title={`Remove ${item.word}`}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" size={17} />
              </button>
            </div>
            <p className="text-sm text-[#475569]">{sentenceFor(item.word, item.count)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
