import styles from "./StatCard.module.css";

type StatCardProps = {
  accent: "target" | "brain" | "streak" | "accuracy";
  label: string;
  value: string;
};

const accentClass = {
  accuracy: styles.accuracy,
  brain: styles.brain,
  streak: styles.streak,
  target: styles.target,
};

export function StatCard({ accent, label, value }: StatCardProps) {
  return (
    <article className={`${styles.statCard} ${accentClass[accent]}`}>
      <div className={styles.statValue}>
        <span aria-hidden="true" className={styles.statIcon} />
        <strong>{value}</strong>
      </div>
      <span className={styles.statLabel}>{label}</span>
    </article>
  );
}
