import { PRACTICE_MODES, PracticeMode } from "@/lib/wordready";

type PracticeTabsProps = {
  activeMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
};

export function PracticeTabs({ activeMode, onModeChange }: PracticeTabsProps) {
  return (
    <div className="practice-tabs">
      <p>How would you like to practice?</p>
      <div role="tablist" aria-label="Practice modes">
        {PRACTICE_MODES.map((mode) => (
          <button
            aria-selected={mode.id === activeMode}
            className={mode.id === activeMode ? "active" : undefined}
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            role="tab"
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
