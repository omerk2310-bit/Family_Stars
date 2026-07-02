import "./Picker.css";

const DEFAULT_ICONS = [
  "🦄", "🌸", "🐣", "🐬", "🦋", "🌟", "🐱", "🐶",
  "🦊", "🐼", "🌈", "🍀", "🌻", "🐙", "🐨", "🦁",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  options?: string[];
}

export function IconPicker({ value, onChange, options = DEFAULT_ICONS }: IconPickerProps) {
  return (
    <div className="picker-grid">
      {options.map((icon) => (
        <button
          key={icon}
          type="button"
          className={`picker-swatch picker-swatch--icon ${value === icon ? "picker-swatch--selected" : ""}`}
          onClick={() => onChange(icon)}
          aria-label={icon}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
