type StatCardProps = {
  accent: "target" | "brain" | "streak" | "accuracy";
  label: string;
  value: string;
};

export function StatCard({ accent, label, value }: StatCardProps) {
  return (
    <article className={`stat-card stat-card-${accent}`}>
      <div className="stat-value">
        <span aria-hidden="true" className="stat-icon" />
        <strong>{value}</strong>
      </div>
      <span className="stat-label">{label}</span>
    </article>
  );
}
