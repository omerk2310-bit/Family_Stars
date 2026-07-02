import "./Badge.css";

interface StarBadgeProps {
  value: number;
  label?: string;
}

export function StarBadge({ value, label }: StarBadgeProps) {
  return (
    <div className="badge badge--star">
      <span className="badge__icon">⭐</span>
      <span className="badge__value">{value}</span>
      {label && <span className="badge__label">{label}</span>}
    </div>
  );
}
