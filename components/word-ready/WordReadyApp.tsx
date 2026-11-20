"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { filterClassWords, isAllowedClassWordWhileTyping } from "@/lib/class-words";
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
  PracticeItem,
  PracticeMode,
  STORAGE_KEYS,
  buildPracticeItems,
} from "@/lib/wordready";

import { AppHeader } from "./AppHeader";
import { BrandPanel } from "./BrandPanel";
import { useWordContexts } from "./useWordContexts";
import styles from "./WordReadyApp.module.css";
import { WorkspacePanel } from "./WorkspacePanel";

export default function WordReadyApp() {
  const [name, setName] = useState("");
  const [wordText, setWordText] = useState("");
  const [hasRejectedWords, setHasRejectedWords] = useState(false);
  const [isEditingWords, setIsEditingWords] = useState(false);
  const [daysUntilTest, setDaysUntilTest] = useState(5);
  const [activeMode, setActiveMode] = useState<PracticeMode>("sentences");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackStatus>>({});
  const [hiddenWordKeys, setHiddenWordKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [trickyWords, setTrickyWords] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const canPractice = name.trim().length > 0;
  const acceptedText = useMemo(() => filterClassWords(wordText).text, [wordText]);
  const words = useMemo(() => parseWords(acceptedText), [acceptedText]);
  const contexts = useWordContexts(words, isEditingWords || !canPractice);
  const plan = useMemo(() => buildPlan(daysUntilTest), [daysUntilTest]);
  const trickyKeys = useMemo(() => new Set(trickyWords), [trickyWords]);
  const masteredKeys = useMemo(() => new Set(masteredWords), [masteredWords]);
  const practiceItems = useMemo(
    () => buildPracticeItems(activeMode, words, contexts),
    [activeMode, words, contexts],
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
    setName(window.localStorage.getItem(STORAGE_KEYS.name) ?? "");
    const storedWords = window.localStorage.getItem(STORAGE_KEYS.words);
    const storedDays = window.localStorage.getItem(STORAGE_KEYS.days);
    const storedTricky = window.localStorage.getItem(STORAGE_KEYS.tricky);
    const storedMastered = window.localStorage.getItem(STORAGE_KEYS.mastered);

    if (storedWords) {
      const filtered = filterClassWords(storedWords);
      setWordText(filtered.text);
      setHasRejectedWords(filtered.rejected > 0);
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
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEYS.name, name.trim());
    }
  }, [isReady, name]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.words, acceptedText);
  }, [isReady, acceptedText]);

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

  function handleWordsChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const { value, selectionStart } = event.currentTarget;
    const input = event.nativeEvent as InputEvent;
    if (input.inputType?.startsWith("delete") || input.isComposing) {
      setWordText(value);
      setHasRejectedWords(false);
    } else if (input.inputType === "insertText" && input.data && !/[,\r\n]/.test(input.data)) {
      const start = Math.max(value.lastIndexOf(",", selectionStart - 1), value.lastIndexOf("\n", selectionStart - 1)) + 1;
      const rest = value.slice(selectionStart).search(/[,\r\n]/);
      const entry = value.slice(start, rest === -1 ? value.length : selectionStart + rest).trim();
      if (entry && !isAllowedClassWordWhileTyping(entry)) {
        setHasRejectedWords(true);
        return;
      }
      setWordText(value);
      setHasRejectedWords(false);
    } else {
      const filtered = filterClassWords(value);
      setWordText(filtered.text);
      setHasRejectedWords(filtered.rejected > 0);
    }
    clearAnswers();
  }

  function handleWordEntryFocusChange(focused: boolean) {
    setIsEditingWords(focused);
    if (!focused) {
      if (acceptedText !== wordText) {
        setHasRejectedWords(true);
      }
      setWordText(acceptedText);
    }
  }

  function clearWords() {
    setWordText("");
    setHasRejectedWords(false);
    clearAnswers();
    setHiddenWordKeys(new Set());
    setTrickyWords([]);
    setMasteredWords([]);
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

  function gradeSentence(item: PracticeItem) {
    const answer = normalizeAnswer(answers[item.id] ?? "");
    if (!answer) {
      return;
    }

    const isCorrect = answer === normalizeAnswer(item.word);
    setFeedback((current) => ({ ...current, [item.id]: isCorrect ? "correct" : "missed" }));
    if (isCorrect) {
      markMastered(item.word);
    } else {
      markTricky(item.word);
    }
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

  function hideWord(word: string) {
    const key = normalizeWord(word);
    setHiddenWordKeys((current) => current.has(key) ? current : new Set([...current, key]));
  }

  function clearAnswers() {
    setAnswers({});
    setFeedback({});
  }

  function resetPractice() {
    clearAnswers();
    setHiddenWordKeys(new Set());
    if (activeMode === "mock") {
      setActiveMode("sentences");
    }
  }

  function switchMode(mode: PracticeMode) {
    if (!canPractice || activeMode === "mock" || mode === activeMode) {
      return;
    }
    setActiveMode(mode);
    clearAnswers();
  }

  return (
    <main className={styles.shell}>
      <BrandPanel
        daysUntilTest={daysUntilTest}
        hasRejectedWords={hasRejectedWords}
        name={name}
        onClearWords={clearWords}
        onDaysChange={setDays}
        onNameChange={setName}
        onWordEntryFocusChange={handleWordEntryFocusChange}
        onWordTextChange={handleWordsChange}
        plan={plan}
        wordText={wordText}
      />

      <div className={styles.practiceArea}>
        <AppHeader stats={stats} />
        <WorkspacePanel
          activeMode={activeMode}
          answers={answers}
          canPractice={canPractice}
          contexts={contexts}
          feedback={feedback}
          hiddenWordKeys={hiddenWordKeys}
          masteredKeys={masteredKeys}
          onGrade={gradePractice}
          onGradeSentence={gradeSentence}
          onHideWord={hideWord}
          onMarkMastered={markMastered}
          onMarkTricky={markTricky}
          onModeChange={switchMode}
          onResetPractice={resetPractice}
          onUpdateAnswer={updateAnswer}
          practiceItems={practiceItems}
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
