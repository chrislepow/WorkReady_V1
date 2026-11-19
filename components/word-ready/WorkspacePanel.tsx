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
  readonly contexts: WordContexts;
  readonly feedback: Record<string, FeedbackStatus>;
  readonly masteredKeys: Set<string>;
  readonly onGrade: () => void;
  readonly onMarkMastered: (word: string) => void;
  readonly onMarkTricky: (word: string) => void;
  readonly onModeChange: (mode: PracticeMode) => void;
  readonly onResetPractice: () => void;
  readonly onUpdateAnswer: (id: string, value: string) => void;
  readonly practiceItems: PracticeItem[];
  readonly trickyKeys: Set<string>;
  readonly words: string[];
};

export function WorkspacePanel({
  activeMode,
  answers,
  contexts,
  feedback,
  masteredKeys,
  onGrade,
  onMarkMastered,
  onMarkTricky,
  onModeChange,
  onResetPractice,
  onUpdateAnswer,
  practiceItems,
  trickyKeys,
  words,
}: WorkspacePanelProps) {
  const hasDictionaryContext = words.some((word) => contexts.get(normalizeWord(word))?.fromDictionary);

  return (
    <section className={styles.workspacePanel} aria-label="Practice workspace">
      <PracticeTabs activeMode={activeMode} onModeChange={onModeChange} />

      <div className={styles.workspaceDivider} />

      <div className={styles.wordCountBadge} aria-label={`${words.length} words`}>
        <strong>{words.length}</strong>
        <span>Words</span>
      </div>

      {words.length === 0 ? (
        <EmptyWords />
      ) : activeMode === "sentences" ? (
        <WordRows
          contexts={contexts}
          masteredKeys={masteredKeys}
          onMarkMastered={onMarkMastered}
          onMarkTricky={onMarkTricky}
          trickyKeys={trickyKeys}
          words={words}
        />
      ) : (
        <PracticeDrill
          answers={answers}
          feedback={feedback}
          items={practiceItems}
          mode={activeMode}
          onGrade={onGrade}
          onReset={onResetPractice}
          onUpdateAnswer={onUpdateAnswer}
        />
      )}

      {hasDictionaryContext && (
        <p className={styles.dictionaryCredit}>
          <a href="https://en.wiktionary.org/" rel="noreferrer" target="_blank">Wiktionary</a>
          {" \u00b7 "}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noreferrer" target="_blank">CC BY-SA 3.0</a>
          {activeMode === "sentences" ? "" : " \u00b7 Adapted for practice"}
        </p>
      )}
    </section>
  );
}
