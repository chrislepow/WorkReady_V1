import { DashboardStats } from "@/lib/wordready";
import { StatCard } from "./StatCard";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  stats: DashboardStats;
};

export function AppHeader({ stats }: AppHeaderProps) {
  return (
    <header className={styles.appHeader}>
      <div className={styles.appTitle}>
        <h1>Spelling Practice</h1>
        <p>Practice your words and track your practice</p>
      </div>

      <div className={styles.statsGrid} aria-label="Practice stats">
        <StatCard
          accent="target"
          label="Words to Learn"
          value={String(stats.wordsToLearn).padStart(2, "0")}
        />
        <StatCard
          accent="brain"
          label="Words Mastered"
          value={String(stats.wordsMastered).padStart(2, "0")}
        />
        <StatCard
          accent="streak"
          label="Day Streak"
          value={String(stats.dayStreak).padStart(2, "0")}
        />
        <StatCard
          accent="accuracy"
          label="Accuracy"
          value={`${stats.accuracy}%`}
        />
      </div>
    </header>
  );
}
