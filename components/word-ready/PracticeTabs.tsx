import { RotateCcw } from "lucide-react";

import { PRACTICE_MODES, PracticeMode } from "@/lib/wordready";

import styles from "./PracticeTabs.module.css";

type PracticeTabsProps = {
  readonly activeMode: PracticeMode;
  readonly disabled: boolean;
  readonly onModeChange: (mode: PracticeMode) => void;
  readonly onResetPractice?: () => void;
};

export function PracticeTabs({ activeMode, disabled, onModeChange, onResetPractice }: PracticeTabsProps) {
  return (
    <div className={styles.practiceTabs}>
      <p>How would you like to practice?</p>
      <div className={styles.practiceControls}>
        <div className={styles.tabList} role="tablist" aria-label="Practice modes">
          {PRACTICE_MODES.map((mode) => (
            <button
              aria-selected={!disabled && mode.id === activeMode}
              className={!disabled && mode.id === activeMode ? styles.active : undefined}
              disabled={disabled || (activeMode === "mock" && mode.id !== "mock")}
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              role="tab"
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
        {onResetPractice && (
          <button className={styles.resetButton} onClick={onResetPractice} type="button">
            <RotateCcw aria-hidden="true" size={17} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
