import { UserRound } from "lucide-react";

import {
  FeedbackStatus,
  PracticeItem,
  PracticeMode,
} from "@/lib/wordready";
import { normalizeWord, type WordContexts } from "@/lib/word-context";

import { EmptyWords } from "./EmptyWords";
import { PracticeDrill } from "./PracticeDrill";
import { PracticeTabs } from "./PracticeTabs";
import styles from "./WorkspacePanel.module.css";
import { WordRows } from "./WordRows";

type WorkspacePanelProps = {
  readonly activeMode: PracticeMode;
  readonly answers: Record<string, string>;
  readonly canPractice: boolean;
  readonly contexts: WordContexts;
  readonly feedback: Record<string, FeedbackStatus>;
  readonly hiddenWordKeys: ReadonlySet<string>;
  readonly masteredKeys: Set<string>;
  readonly onGrade: () => void;
  readonly onGradeSentence: (item: PracticeItem) => void;
  readonly onHideWord: (word: string) => void;
  readonly onLockWordList: () => void;
  readonly onMarkMastered: (word: string) => void;
  readonly onMarkTricky: (word: string) => void;
  readonly onModeChange: (mode: PracticeMode) => void;
  readonly onResetPractice?: () => void;
  readonly onUpdateAnswer: (id: string, value: string) => void;
  readonly practiceItems: PracticeItem[];
  readonly trickyKeys: Set<string>;
  readonly words: string[];
};

export function WorkspacePanel({
  activeMode,
  answers,
  canPractice,
  contexts,
  feedback,
  hiddenWordKeys,
  masteredKeys,
  onGrade,
  onGradeSentence,
  onHideWord,
  onLockWordList,
  onMarkMastered,
  onMarkTricky,
  onModeChange,
  onResetPractice,
  onUpdateAnswer,
  practiceItems,
  trickyKeys,
  words,
}: WorkspacePanelProps) {
  const dictionaryContexts = words.map((word) => contexts.get(normalizeWord(word)));
  const hasDictionaryContext = dictionaryContexts.some((context) => context?.fromDictionary);
  const hasAdaptedContext = activeMode !== "sentences" || dictionaryContexts.some((context) => context?.adapted);

  return (
    <section className={styles.workspacePanel} aria-label="Practice workspace">
      <PracticeTabs
        activeMode={activeMode}
        disabled={!canPractice}
        onModeChange={onModeChange}
        onResetPractice={onResetPractice}
      />

      <div className={styles.workspaceDivider} />

      <div className={styles.wordCountBadge} aria-label={`${words.length} words`}>
        <strong>{words.length}</strong>
        <span>Words</span>
      </div>

      {!canPractice ? (
        <div className={styles.namePrompt}>
          <UserRound aria-hidden="true" size={28} />
          <p>Enter your name to start practicing.</p>
        </div>
      ) : words.length === 0 ? (
        <EmptyWords />
      ) : activeMode === "sentences" ? (
        <WordRows
          answers={answers}
          feedback={feedback}
          hiddenWordKeys={hiddenWordKeys}
          items={practiceItems}
          masteredKeys={masteredKeys}
          onGrade={onGradeSentence}
          onHideWord={onHideWord}
          onMarkMastered={onMarkMastered}
          onMarkTricky={onMarkTricky}
          onUpdateAnswer={onUpdateAnswer}
          trickyKeys={trickyKeys}
        />
      ) : (
        <PracticeDrill
          answers={answers}
          feedback={feedback}
          items={practiceItems}
          mode={activeMode}
          onFocusAnswer={onLockWordList}
          onGrade={onGrade}
          onUpdateAnswer={onUpdateAnswer}
        />
      )}

      {canPractice && hasDictionaryContext && (
        <p className={styles.dictionaryCredit}>
          <a href="https://en.wiktionary.org/" rel="noreferrer" target="_blank">Wiktionary</a>
          {" \u00b7 "}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noreferrer" target="_blank">CC BY-SA 3.0</a>
          {hasAdaptedContext ? " \u00b7 Adapted for practice" : ""}
        </p>
      )}
    </section>
  );
}
