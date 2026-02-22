'use client';

const PRESET_COLORS = [
  { label: '퍼플', hex: '#bf7ca7' },
  { label: '블루', hex: '#8db8da' },
  { label: '그린', hex: '#238457' },
  { label: '엘로우', hex: '#f5dc4c' },
  { label: '오렌지', hex: '#f4a53e' },
  { label: '레드', hex: '#b21b3c' },
  { label: '블랙', hex: '#000000' },
  { label: '그레이', hex: '#757575' },
  { label: '엘로우그린', hex: '#85d150' },
  { label: '핑크', hex: '#eb9596' },
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
