'use client';

import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="w-full max-w-full overflow-hidden rounded-lg">
        <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border border-gray-300 shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => {
            const val = e.target.value;
            // Allow typing hex values: accept # prefix and hex chars
            if (/^#?[0-9a-fA-F]{0,6}$/.test(val)) {
              onChange(val.startsWith('#') ? val : `#${val}`);
            }
          }}
          placeholder="#000000"
          aria-label={`${label} hex value`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
      </div>
    </div>
  );
}
