import { Check, CheckCircle2, Info, Volume2, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";

import { wordPattern } from "@/lib/word-context";
import { normalizeAnswer, normalizeWord, type FeedbackStatus, type PracticeItem } from "@/lib/wordready";

import styles from "./WordRows.module.css";

type WordRowsProps = {
  readonly answers: Record<string, string>;
  readonly feedback: Record<string, FeedbackStatus>;
  readonly hiddenWordKeys: ReadonlySet<string>;
  readonly items: PracticeItem[];
  readonly masteredKeys: Set<string>;
  readonly onGrade: (item: PracticeItem) => void;
  readonly onHideWord: (word: string) => void;
  readonly onMarkMastered: (word: string) => void;
  readonly onMarkTricky: (word: string) => void;
  readonly onUpdateAnswer: (id: string, value: string) => void;
  readonly trickyKeys: Set<string>;
};

export function WordRows({
  answers,
  feedback,
  hiddenWordKeys,
  items,
  masteredKeys,
  onGrade,
  onHideWord,
  onMarkMastered,
  onMarkTricky,
  onUpdateAnswer,
  trickyKeys,
}: WordRowsProps) {
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [audioErrorId, setAudioErrorId] = useState<string | null>(null);

  useEffect(() => () => {
    if (speech.current) {
      speech.current = null;
      window.speechSynthesis?.cancel();
    }
  }, []);

  function pronounce(item: PracticeItem) {
    const synthesizer = window.speechSynthesis;
    if (!synthesizer || !window.SpeechSynthesisUtterance) {
      setAudioErrorId(item.id);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    speech.current = utterance;
    synthesizer.cancel();
    setSpeakingId(item.id);
    setAudioErrorId(null);

    function finish(error = false) {
      if (speech.current === utterance) {
        speech.current = null;
        setSpeakingId(null);
        if (error) {
          setAudioErrorId(item.id);
        }
      }
    }

    utterance.onend = () => finish();
    utterance.onerror = () => finish(true);
    synthesizer.speak(utterance);
  }

  return (
    <section aria-label="Sentence practice">
      <div className={styles.wordList} aria-label="Class word list">
        {items.map((item, index) => {
          const { id, word, prompt } = item;
          const key = normalizeWord(word);
          const isWordHidden = hiddenWordKeys.has(key);
          const isMastered = masteredKeys.has(key);
          const isTricky = trickyKeys.has(key);
          const answer = answers[id] ?? "";
          const status = feedback[id];
          const wordLabel = isWordHidden ? `word ${index + 1}` : word;

          return (
            <article
              className={[
                styles.wordRow,
                isMastered ? styles.wordRowMastered : "",
                isTricky ? styles.wordRowTricky : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={id}
            >
              <div className={styles.wordRowCopy}>
                <div className={styles.wordHeading}>
                  <span className={styles.wordChip}>
                    {isWordHidden ? <BlurredWord word={word} /> : word}
                  </span>
                  <button
                    aria-label={`Pronounce ${wordLabel}`}
                    className={styles.speakerButton}
                    data-speaking={speakingId === id}
                    onClick={() => pronounce(item)}
                    title="Pronounce word"
                    type="button"
                  >
                    <Volume2 aria-hidden="true" size={18} />
                  </button>
                </div>
                <p>{isWordHidden ? <BlurredSentence sentence={prompt} word={word} /> : prompt}</p>
                {audioErrorId === id && <p role="status">Pronunciation is unavailable.</p>}
              </div>

              <form
                className={styles.answerForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  onGrade(item);
                }}
              >
                <label htmlFor={`sentence-answer-${index}`}>Answer</label>
                <div className={styles.answerControls}>
                  <input
                    aria-describedby={`sentence-feedback-${index}`}
                    aria-invalid={status === "missed"}
                    aria-label={`Answer for word ${index + 1}`}
                    autoCapitalize="none"
                    autoComplete="off"
                    id={`sentence-answer-${index}`}
                    onChange={(event) => onUpdateAnswer(id, event.target.value)}
                    onFocus={() => onHideWord(word)}
                    placeholder="Type the word"
                    spellCheck={false}
                    value={answer}
                  />
                  <span
                    className={styles.answerResult}
                    data-status={status}
                    id={`sentence-feedback-${index}`}
                    role="status"
                  >
                    {status === "correct" && <Check aria-hidden="true" size={19} strokeWidth={3} />}
                    {status === "missed" && <X aria-hidden="true" size={19} strokeWidth={3} />}
                    <span className={styles.screenReaderText}>
                      {status === "correct" ? "Correct" : status === "missed" ? "Try again" : ""}
                    </span>
                  </span>
                  <button
                    aria-label={`Check answer for word ${index + 1}`}
                    disabled={!normalizeAnswer(answer)}
                    type="submit"
                  >
                    Check
                  </button>
                </div>
              </form>

              <div className={styles.wordRowActions}>
                <span>WORD {index + 1}</span>
                <div>
                  <button
                    aria-label={`Mark ${wordLabel} mastered`}
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
    </section>
  );
}

function BlurredWord({ word }: { readonly word: string }) {
  return (
    <span aria-label="Hidden word" role="img">
      <span aria-hidden="true" className={styles.blurredWord}>{word}</span>
    </span>
  );
}

function BlurredSentence({ sentence, word }: { readonly sentence: string; readonly word: string }) {
  const matches = [...sentence.matchAll(wordPattern(word))];
  const lastMatch = matches.at(-1);

  return (
    <>
      {matches.map((match, index) => {
        const previous = matches[index - 1];
        const start = previous ? previous.index + previous[0].length : 0;
        return (
          <Fragment key={match.index}>
            {sentence.slice(start, match.index)}
            <BlurredWord word={match[0]} />
          </Fragment>
        );
      })}
      {sentence.slice(lastMatch ? lastMatch.index + lastMatch[0].length : 0)}
    </>
  );
}
