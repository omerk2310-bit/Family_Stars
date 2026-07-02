import "./ChildAvatar.css";

interface ChildAvatarProps {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

export function ChildAvatar({ icon, color, size = "md" }: ChildAvatarProps) {
  return (
    <div className={`child-avatar child-avatar--${size}`} style={{ background: color }}>
      <span>{icon}</span>
    </div>
  );
}
