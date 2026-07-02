import "./Picker.css";

const DEFAULT_COLORS = [
  "#7c5cff", "#ff8fab", "#ffb703", "#4cc9f0",
  "#52b788", "#f4845f", "#9d8df1", "#f06595",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  options?: string[];
}

export function ColorPicker({ value, onChange, options = DEFAULT_COLORS }: ColorPickerProps) {
  return (
    <div className="picker-grid">
      {options.map((color) => (
        <button
          key={color}
          type="button"
          className={`picker-swatch picker-swatch--color ${value === color ? "picker-swatch--selected" : ""}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={color}
        />
      ))}
    </div>
  );
}
