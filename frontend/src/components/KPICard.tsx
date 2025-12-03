interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "positive" | "negative" | "warning";
}

export default function KPICard({
  label,
  value,
  subtitle,
  variant = "default",
}: KPICardProps) {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
