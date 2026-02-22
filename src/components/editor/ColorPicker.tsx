'use client';

const PRESET_COLORS = [
  { label: 'Navy', hex: '#020912' },
  { label: 'Cream', hex: '#fcfcfc' },
  { label: 'Sage', hex: '#4a7c6f' },
  { label: 'Blue', hex: '#5b8fa8' },
  { label: 'Orange', hex: '#ffa639' },
  { label: 'Peach', hex: '#e8a87c' },
  { label: 'Charcoal', hex: '#2d3436' },
  { label: 'Gray', hex: '#757575' },
  { label: 'Slate', hex: '#4a5568' },
  { label: 'Black', hex: '#000000' },
] as const;

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const normalizedColor = color.toLowerCase();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="grid grid-cols-5 gap-3">
        {PRESET_COLORS.map((preset) => {
          const isSelected = normalizedColor === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange(preset.hex)}
              aria-label={`${preset.label} (${preset.hex})`}
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-10 h-10 border-2 transition-all ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-[#020912] border-[#020912] scale-110'
                    : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                }`}
                style={{ backgroundColor: preset.hex }}
              />
              <span
                className={`text-xs leading-tight text-center ${
                  isSelected
                    ? 'font-semibold text-[#020912]'
                    : 'text-gray-500 group-hover:text-gray-700'
                }`}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
