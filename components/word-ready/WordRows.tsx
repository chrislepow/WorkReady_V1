import { CheckCircle2, Info } from "lucide-react";

import { normalizeWord, sentenceFor } from "@/lib/wordready";

type WordRowsProps = {
  masteredKeys: Set<string>;
  onMarkMastered: (word: string) => void;
  onMarkTricky: (word: string) => void;
  trickyKeys: Set<string>;
  words: string[];
};

export function WordRows({
  masteredKeys,
  onMarkMastered,
  onMarkTricky,
  trickyKeys,
  words,
}: WordRowsProps) {
  return (
    <div className="word-list" aria-label="Class word list">
      {words.map((word, index) => {
        const key = normalizeWord(word);
        const isMastered = masteredKeys.has(key);
        const isTricky = trickyKeys.has(key);

        return (
          <article
            className={`word-row ${isMastered ? "word-row-mastered" : ""} ${
              isTricky ? "word-row-tricky" : ""
            }`}
            key={`${key}-${index}`}
          >
            <div className="word-row-copy">
              <span className="word-chip">{word}</span>
              <p>{sentenceFor(word, index)}</p>
            </div>

            <div className="word-row-actions">
              <span>WORD {index + 1}</span>
              <div>
                <button
                  aria-label={`Mark ${word} mastered`}
                  aria-pressed={isMastered}
                  className={`mastered-button ${isMastered ? "active" : ""}`}
                  onClick={() => onMarkMastered(word)}
                  title="Mark mastered"
                  type="button"
                >
                  <CheckCircle2 aria-hidden="true" size={17} />
                </button>
                <button
                  aria-pressed={isTricky}
                  className={`tricky-button ${isTricky ? "active" : ""}`}
                  onClick={() => onMarkTricky(word)}
                  type="button"
                >
                  <Info aria-hidden="true" size={16} />
                  Tricky
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
