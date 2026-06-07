import { BookOpen, CalendarDays, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

import { MAX_DAYS, MIN_DAYS, PlanItem } from "@/lib/wordready";

import styles from "./BrandPanel.module.css";

type BrandPanelProps = {
  daysUntilTest: number;
  plan: PlanItem[];
  wordText: string;
  onClearWords: () => void;
  onDaysChange: (days: number) => void;
  onWordTextChange: (text: string) => void;
};

export function BrandPanel({
  daysUntilTest,
  plan,
  wordText,
  onClearWords,
  onDaysChange,
  onWordTextChange,
}: BrandPanelProps) {
  const todayPlan = plan[0];

  return (
    <aside className={styles.brandPanel} aria-label="WordReady controls">
      <div className={styles.brandLockup} aria-label="Word Ready">
        <div className={styles.brandWord}>WORD</div>
        <div className={styles.brandReady}>READY</div>
        <div className={styles.brandRule} />
        <p>Learn to spell words in less than a week</p>
      </div>

      <section className={styles.sidebarSection}>
        <h2>
          <CalendarDays aria-hidden="true" size={23} />
          Days Until Test
        </h2>
        <div className={styles.daysPicker}>
          <div className={styles.daysStepper}>
            <input
              aria-label="Days until test"
              max={MAX_DAYS}
              min={MIN_DAYS}
              onChange={(event) => onDaysChange(Number(event.target.value))}
              type="number"
              value={String(daysUntilTest).padStart(2, "0")}
            />
            <div className={styles.daysStepperButtons}>
              <button
                aria-label="Increase days until test"
                onClick={() => onDaysChange(daysUntilTest + 1)}
                type="button"
              >
                <ChevronUp aria-hidden="true" size={13} />
              </button>
              <button
                aria-label="Decrease days until test"
                onClick={() => onDaysChange(daysUntilTest - 1)}
                type="button"
              >
                <ChevronDown aria-hidden="true" size={13} />
              </button>
            </div>
          </div>
          <span>Days</span>
        </div>
      </section>

      <section className={styles.sidebarSection}>
        <h2>
          <BookOpen aria-hidden="true" size={23} />
          Class Words
        </h2>
        <textarea
          aria-label="Class words"
          className={styles.wordEntry}
          onChange={(event) => onWordTextChange(event.target.value)}
          placeholder="Start typing your words..."
          spellCheck={false}
          value={wordText}
        />
        <button className={styles.clearButton} onClick={onClearWords} type="button">
          Clear
        </button>
      </section>

      <section className={`${styles.sidebarSection} ${styles.countdownSection}`}>
        <h2>
          <BookOpen aria-hidden="true" size={23} />
          Test Countdown
        </h2>
        <div className={styles.countdownCard}>
          <div className={styles.countdownCardTop}>
            <p>Plan adjusts from today to test day.</p>
            <span>{String(daysUntilTest).padStart(2, "0")} Days</span>
          </div>

          <div className={styles.countdownControls}>
            <button
              aria-label="One fewer day"
              onClick={() => onDaysChange(daysUntilTest - 1)}
              type="button"
            >
              <Minus aria-hidden="true" size={19} />
            </button>
            <input
              aria-label="Countdown slider"
              max={MAX_DAYS}
              min={MIN_DAYS}
              onChange={(event) => onDaysChange(Number(event.target.value))}
              type="range"
              value={daysUntilTest}
            />
            <button
              aria-label="One more day"
              onClick={() => onDaysChange(daysUntilTest + 1)}
              type="button"
            >
              <Plus aria-hidden="true" size={19} />
            </button>
          </div>

          <div className={styles.todayCard}>
            <span>TODAY</span>
            <strong>{todayPlan?.label ?? "Practice"}</strong>
          </div>

          <ol className={styles.countdownPlan} aria-label="Daily practice countdown">
            {plan.map((item) => (
              <li
                className={item.mode === "mock" ? styles.mockDay : undefined}
                key={`${item.day}-${item.mode}`}
              >
                <span>{String(item.daysLeft).padStart(2, "0")}</span>
                <div>
                  <strong>{item.day}</strong>
                  <em>{item.label}</em>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </aside>
  );
}
