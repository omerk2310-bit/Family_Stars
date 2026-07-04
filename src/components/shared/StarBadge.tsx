import "./Badge.css";

interface StarBadgeProps {
  value: number;
  label?: string;
  gold?: boolean;
}

export function StarBadge({ value, label, gold }: StarBadgeProps) {
  return (
    <div className={`badge ${gold ? "badge--gold" : "badge--star"}`}>
      <span className="badge__icon">{gold ? "🌟" : "⭐"}</span>
      <span className="badge__value">{value}</span>
      {label && <span className="badge__label">{label}</span>}
    </div>
  );
}
