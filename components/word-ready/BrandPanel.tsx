import { BookOpen, CalendarDays, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

import { MAX_DAYS, MIN_DAYS, PlanItem } from "@/lib/wordready";

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
    <aside className="brand-panel" aria-label="WordReady controls">
      <div className="brand-lockup" aria-label="Word Ready">
        <div className="brand-word">WORD</div>
        <div className="brand-ready">READY</div>
        <div className="brand-rule" />
        <p>Learn to spell words in less than a week</p>
      </div>

      <section className="sidebar-section">
        <h2>
          <CalendarDays aria-hidden="true" size={23} />
          Days Until Test
        </h2>
        <div className="days-picker">
          <div className="days-stepper">
            <input
              aria-label="Days until test"
              max={MAX_DAYS}
              min={MIN_DAYS}
              onChange={(event) => onDaysChange(Number(event.target.value))}
              type="number"
              value={String(daysUntilTest).padStart(2, "0")}
            />
            <div className="days-stepper-buttons">
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

      <section className="sidebar-section">
        <h2>
          <BookOpen aria-hidden="true" size={23} />
          Class Words
        </h2>
        <textarea
          aria-label="Class words"
          className="word-entry"
          onChange={(event) => onWordTextChange(event.target.value)}
          placeholder="Start typing your words..."
          spellCheck={false}
          value={wordText}
        />
        <button className="clear-button" onClick={onClearWords} type="button">
          Clear
        </button>
      </section>

      <section className="sidebar-section countdown-section">
        <h2>
          <BookOpen aria-hidden="true" size={23} />
          Test Countdown
        </h2>
        <div className="countdown-card">
          <div className="countdown-card-top">
            <p>Plan adjusts from today to test day.</p>
            <span>{String(daysUntilTest).padStart(2, "0")} Days</span>
          </div>

          <div className="countdown-controls">
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

          <div className="today-card">
            <span>TODAY</span>
            <strong>{todayPlan?.label ?? "Practice"}</strong>
          </div>

          <ol className="countdown-plan" aria-label="Daily practice countdown">
            {plan.map((item) => (
              <li
                className={item.mode === "mock" ? "mock-day" : undefined}
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
