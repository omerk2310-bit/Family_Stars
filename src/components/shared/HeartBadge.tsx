import "./Badge.css";

interface HeartBadgeProps {
  value: number;
  label?: string;
}

export function HeartBadge({ value, label }: HeartBadgeProps) {
  return (
    <div className="badge badge--heart">
      <span className="badge__icon">💗</span>
      <span className="badge__value">{value}</span>
      {label && <span className="badge__label">{label}</span>}
    </div>
  );
}
