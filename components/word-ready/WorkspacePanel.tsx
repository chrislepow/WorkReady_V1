import {
  buildPracticeItems,
  FeedbackStatus,
  PracticeMode,
} from "@/lib/wordready";

import { EmptyWords } from "./EmptyWords";
import { PracticeDrill } from "./PracticeDrill";
import { PracticeTabs } from "./PracticeTabs";
import styles from "./WorkspacePanel.module.css";
import { WordRows } from "./WordRows";

type WorkspacePanelProps = {
  activeMode: PracticeMode;
  answers: Record<string, string>;
  feedback: Record<string, FeedbackStatus>;
  masteredKeys: Set<string>;
  onGrade: () => void;
  onMarkMastered: (word: string) => void;
  onMarkTricky: (word: string) => void;
  onModeChange: (mode: PracticeMode) => void;
  onResetPractice: () => void;
  onUpdateAnswer: (id: string, value: string) => void;
  trickyKeys: Set<string>;
  words: string[];
};

export function WorkspacePanel({
  activeMode,
  answers,
  feedback,
  masteredKeys,
  onGrade,
  onMarkMastered,
  onMarkTricky,
  onModeChange,
  onResetPractice,
  onUpdateAnswer,
  trickyKeys,
  words,
}: WorkspacePanelProps) {
  const practiceItems = buildPracticeItems(activeMode, words);

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
    </section>
  );
}
