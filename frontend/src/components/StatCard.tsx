interface Props {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}

export default function StatCard({ label, value, sub, valueClass }: Props) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${valueClass ?? ""}`}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
