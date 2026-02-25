'use client';

import { useCardStore } from '@/stores/useCardStore';

export function HearthstoneStatInput() {
  const mana = useCardStore((state) => state.card.hearthstoneMeta?.mana ?? 3);
  const attack = useCardStore((state) => state.card.hearthstoneMeta?.attack ?? 2);
  const health = useCardStore((state) => state.card.hearthstoneMeta?.health ?? 5);
  const setMana = useCardStore((state) => state.setHearthstoneMana);
  const setAttack = useCardStore((state) => state.setHearthstoneAttack);
  const setHealth = useCardStore((state) => state.setHearthstoneHealth);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Stats
      </label>
      <div className="grid grid-cols-3 gap-3">
        {/* Mana */}
        <StatField
          id="hs-mana"
          label="Mana"
          value={mana}
          min={0}
          max={10}
          color="#1E90FF"
          onChange={setMana}
        />
        {/* Attack */}
        <StatField
          id="hs-attack"
          label="Attack"
          value={attack}
          min={0}
          max={12}
          color="#DAA520"
          onChange={setAttack}
        />
        {/* Health */}
        <StatField
          id="hs-health"
          label="Health"
          value={health}
          min={1}
          max={12}
          color="#CC0000"
          onChange={setHealth}
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
