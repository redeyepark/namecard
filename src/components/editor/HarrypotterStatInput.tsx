'use client';

import { useCardStore } from '@/stores/useCardStore';

export function HarrypotterStatInput() {
  const year = useCardStore((state) => state.card.harrypotterMeta?.year ?? 1);
  const spellPower = useCardStore((state) => state.card.harrypotterMeta?.spellPower ?? 100);
  const setYear = useCardStore((state) => state.setHarrypotterYear);
  const setSpellPower = useCardStore((state) => state.setHarrypotterSpellPower);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Stats
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* Year */}
        <StatField
          id="hp-year"
          label="Year"
          value={year}
          min={1}
          max={7}
          color="#D4A76A"
          onChange={setYear}
        />
        {/* Spell Power */}
        <StatField
          id="hp-spellpower"
          label="Spell Power"
          value={spellPower}
          min={0}
          max={999}
          color="#740001"
          onChange={setSpellPower}
        />
      </div>
    </div>
  );
}

function StatField({
  id,
  label,
  value,
  min,
  max,
  color,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') {
      onChange(min);
      return;
    }
    const num = parseInt(v, 10);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const increment = () => onChange(Math.min(max, value + 1));
  const decrement = () => onChange(Math.max(min, value - 1));

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-xs font-medium"
        style={{ color }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={decrement}
          aria-label={`Decrease ${label}`}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          -
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="w-12 px-1 py-1.5 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={increment}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}
