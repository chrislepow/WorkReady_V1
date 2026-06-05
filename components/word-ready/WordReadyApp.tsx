"use client";

import { useEffect, useMemo, useState } from "react";

import {
  boundNumber,
  buildPlan,
  calculateDashboardStats,
  FeedbackStatus,
  MAX_DAYS,
  MIN_DAYS,
  normalizeAnswer,
  normalizeWord,
  parseWords,
  PracticeMode,
  SAMPLE_WORDS,
  STORAGE_KEYS,
  buildPracticeItems,
} from "@/lib/wordready";

import { AppHeader } from "./AppHeader";
import { BrandPanel } from "./BrandPanel";
import { WorkspacePanel } from "./WorkspacePanel";

export default function WordReadyApp() {
  const [wordText, setWordText] = useState("");
  const [daysUntilTest, setDaysUntilTest] = useState(5);
  const [activeMode, setActiveMode] = useState<PracticeMode>("sentences");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackStatus>>({});
  const [trickyWords, setTrickyWords] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const words = useMemo(() => parseWords(wordText), [wordText]);
  const plan = useMemo(() => buildPlan(daysUntilTest), [daysUntilTest]);
  const trickyKeys = useMemo(() => new Set(trickyWords), [trickyWords]);
  const masteredKeys = useMemo(() => new Set(masteredWords), [masteredWords]);
  const practiceItems = useMemo(
    () => buildPracticeItems(activeMode, words),
    [activeMode, words],
  );
  const correctAnswers = Object.values(feedback).filter((status) => status === "correct").length;
  const totalAnswers = Object.keys(feedback).length;
  const stats = useMemo(
    () =>
      calculateDashboardStats({
        correctAnswers,
        masteredKeys,
        totalAnswers,
        words,
      }),
    [correctAnswers, masteredKeys, totalAnswers, words],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Local storage hydration only runs in the browser. */
    const storedWords = window.localStorage.getItem(STORAGE_KEYS.words);
    const storedDays = window.localStorage.getItem(STORAGE_KEYS.days);
    const storedTricky = window.localStorage.getItem(STORAGE_KEYS.tricky);
    const storedMastered = window.localStorage.getItem(STORAGE_KEYS.mastered);

    if (storedWords) {
      setWordText(storedWords);
    }

    if (storedDays) {
      setDaysUntilTest(boundNumber(Number(storedDays) || 5, MIN_DAYS, MAX_DAYS));
    }

    setTrickyWords(readStoredKeys(storedTricky));
    setMasteredWords(readStoredKeys(storedMastered));
    setIsReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.words, wordText);
  }, [isReady, wordText]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.days, String(daysUntilTest));
  }, [daysUntilTest, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.tricky, JSON.stringify(trickyWords));
  }, [isReady, trickyWords]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.mastered, JSON.stringify(masteredWords));
  }, [isReady, masteredWords]);

  function setDays(nextDays: number) {
    setDaysUntilTest(boundNumber(nextDays, MIN_DAYS, MAX_DAYS));
  }

  function handleWordsChange(nextText: string) {
    setWordText(nextText);
    setAnswers({});
    setFeedback({});
  }

  function clearWords() {
    setWordText("");
    setAnswers({});
    setFeedback({});
    setTrickyWords([]);
    setMasteredWords([]);
  }

  function useSampleWords() {
    handleWordsChange(SAMPLE_WORDS.join("\n"));
  }

  function markTricky(word: string) {
    const key = normalizeWord(word);

    setTrickyWords((current) => addKey(current, key));
    setMasteredWords((current) => current.filter((item) => item !== key));
  }

  function markMastered(word: string) {
    const key = normalizeWord(word);

    setMasteredWords((current) => addKey(current, key));
    setTrickyWords((current) => current.filter((item) => item !== key));
  }

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setFeedback((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function gradePractice() {
    const nextFeedback: Record<string, FeedbackStatus> = {};
    const nextMastered: string[] = [];
    const nextTricky: string[] = [];

    practiceItems.forEach((item) => {
      const isCorrect = normalizeAnswer(answers[item.id] ?? "") === normalizeAnswer(item.word);
      const key = normalizeWord(item.word);

      nextFeedback[item.id] = isCorrect ? "correct" : "missed";

      if (isCorrect) {
        nextMastered.push(key);
      } else {
        nextTricky.push(key);
      }
    });

    setFeedback(nextFeedback);
    setMasteredWords((current) => nextMastered.reduce(addKey, current));
    setTrickyWords((current) => nextTricky.reduce(addKey, current));
  }

  function resetPractice() {
    setAnswers({});
    setFeedback({});
  }

  function switchMode(mode: PracticeMode) {
    setActiveMode(mode);
    setAnswers({});
    setFeedback({});
  }

  return (
    <main className="wordready-shell">
      <BrandPanel
        daysUntilTest={daysUntilTest}
        onClearWords={clearWords}
        onDaysChange={setDays}
        onWordTextChange={handleWordsChange}
        plan={plan}
        wordText={wordText}
      />

      <div className="practice-area">
        <AppHeader stats={stats} />
        <WorkspacePanel
          activeMode={activeMode}
          answers={answers}
          feedback={feedback}
          masteredKeys={masteredKeys}
          onGrade={gradePractice}
          onMarkMastered={markMastered}
          onMarkTricky={markTricky}
          onModeChange={switchMode}
          onResetPractice={resetPractice}
          onUpdateAnswer={updateAnswer}
          onUseSampleWords={useSampleWords}
          trickyKeys={trickyKeys}
          words={words}
        />
      </div>
    </main>
  );
}

function addKey(current: string[], key: string) {
  if (current.includes(key)) {
    return current;
  }

  return [...current, key];
}

function readStoredKeys(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }

  return [];
}
