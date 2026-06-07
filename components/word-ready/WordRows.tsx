import { CheckCircle2, Info } from "lucide-react";

import { normalizeWord, sentenceFor } from "@/lib/wordready";

import styles from "./WordRows.module.css";

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
    <div className={styles.wordList} aria-label="Class word list">
      {words.map((word, index) => {
        const key = normalizeWord(word);
        const isMastered = masteredKeys.has(key);
        const isTricky = trickyKeys.has(key);

        return (
          <article
            className={[
              styles.wordRow,
              isMastered ? styles.wordRowMastered : "",
              isTricky ? styles.wordRowTricky : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={`${key}-${index}`}
          >
            <div className={styles.wordRowCopy}>
              <span className={styles.wordChip}>{word}</span>
              <p>{sentenceFor(word, index)}</p>
            </div>

            <div className={styles.wordRowActions}>
              <span>WORD {index + 1}</span>
              <div>
                <button
                  aria-label={`Mark ${word} mastered`}
                  aria-pressed={isMastered}
                  className={[
                    styles.masteredButton,
                    isMastered ? styles.active : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onMarkMastered(word)}
                  title="Mark mastered"
                  type="button"
                >
                  <CheckCircle2 aria-hidden="true" size={17} />
                </button>
                <button
                  aria-pressed={isTricky}
                  className={[
                    styles.trickyButton,
                    isTricky ? styles.active : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
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
