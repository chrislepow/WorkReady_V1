import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from "lucide-react";

import { FeedbackStatus, PracticeItem, PracticeMode } from "@/lib/wordready";

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
    <div className="practice-drill">
      <div className="drill-toolbar">
        <button className="secondary-action" onClick={onReset} type="button">
          <RotateCcw aria-hidden="true" size={17} />
          Reset
        </button>
        <button className="primary-action" onClick={onGrade} type="button">
          <ClipboardCheck aria-hidden="true" size={17} />
          {isMock ? "Grade Test" : "Check Answers"}
        </button>
      </div>

      <div className="drill-list">
        {items.map((item, index) => {
          const status = feedback[item.id];

          return (
            <article className={`drill-row ${status ? `drill-row-${status}` : ""}`} key={item.id}>
              <div className="drill-prompt">
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
                <div className={`result-pill result-pill-${status}`}>
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
