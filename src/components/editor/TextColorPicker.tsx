'use client';

const TEXT_COLORS = [
  { label: '화이트', hex: '#FFFFFF' },
  { label: '블랙', hex: '#000000' },
] as const;

interface TextColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function TextColorPicker({ color, onChange }: TextColorPickerProps) {
  const normalizedColor = color.toUpperCase();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">
        텍스트 컬러
      </label>
      <div className="flex gap-4">
        {TEXT_COLORS.map((preset) => {
          const isSelected = normalizedColor === preset.hex;
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
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-primary border-primary scale-110'
                    : 'border-border-medium hover:border-border-medium hover:scale-105'
                }`}
                style={{ backgroundColor: preset.hex }}
              />
              <span
                className={`text-xs leading-tight text-center ${
                  isSelected
                    ? 'font-semibold text-primary'
                    : 'text-text-secondary group-hover:text-text-primary'
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
