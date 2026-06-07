import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from "lucide-react";

import { FeedbackStatus, PracticeItem, PracticeMode } from "@/lib/wordready";

import styles from "./PracticeDrill.module.css";

type PracticeDrillProps = {
  answers: Record<string, string>;
  feedback: Record<string, FeedbackStatus>;
  items: PracticeItem[];
  mode: PracticeMode;
  onGrade: () => void;
  onReset: () => void;
  onUpdateAnswer: (id: string, value: string) => void;
};

export function PracticeDrill({
  answers,
  feedback,
  items,
  mode,
  onGrade,
  onReset,
  onUpdateAnswer,
}: PracticeDrillProps) {
  const isMock = mode === "mock";

  return (
    <div className={styles.practiceDrill}>
      <div className={styles.drillToolbar}>
        <button className={styles.secondaryAction} onClick={onReset} type="button">
          <RotateCcw aria-hidden="true" size={17} />
          Reset
        </button>
        <button className={styles.primaryAction} onClick={onGrade} type="button">
          <ClipboardCheck aria-hidden="true" size={17} />
          {isMock ? "Grade Test" : "Check Answers"}
        </button>
      </div>

      <div className={styles.drillList}>
        {items.map((item, index) => {
          const status = feedback[item.id];

          return (
            <article
              className={[
                styles.drillRow,
                status === "correct" ? styles.drillRowCorrect : "",
                status === "missed" ? styles.drillRowMissed : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={item.id}
            >
              <div className={styles.drillPrompt}>
                <span>{isMock ? `TEST WORD ${index + 1}` : `PRACTICE WORD ${index + 1}`}</span>
                <strong>{item.prompt}</strong>
                {item.helper ? <p>{item.helper}</p> : null}
              </div>

              <label>
                <span>Answer</span>
                <input
                  aria-label={`Answer for word ${index + 1}`}
                  autoCapitalize="none"
                  onChange={(event) => onUpdateAnswer(item.id, event.target.value)}
                  placeholder="Type the word"
                  spellCheck={false}
                  value={answers[item.id] ?? ""}
                />
              </label>

              {status ? (
                <div
                  className={[
                    styles.resultPill,
                    status === "correct" ? styles.resultPillCorrect : styles.resultPillMissed,
                  ].join(" ")}
                >
                  {status === "correct" ? (
                    <CheckCircle2 aria-hidden="true" size={16} />
                  ) : (
                    <XCircle aria-hidden="true" size={16} />
                  )}
                  {status === "correct" ? "Correct" : `Answer: ${item.word}`}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
