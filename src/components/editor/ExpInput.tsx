'use client';

import { useCardStore } from '@/stores/useCardStore';
import { Button } from '@/components/ui';

export function ExpInput() {
  const exp = useCardStore((state) => state.card.pokemonMeta?.exp ?? 100);
  const setPokemonExp = useCardStore((state) => state.setPokemonExp);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for user to clear and type
    if (value === '') {
      setPokemonExp(0);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setPokemonExp(num);
    }
  };

  const increment = () => setPokemonExp(Math.min(999, exp + 10));
  const decrement = () => setPokemonExp(Math.max(0, exp - 10));

  return (
    <div className="space-y-3">
      <label
        htmlFor="pokemon-exp"
        className="block text-sm font-medium text-text-primary"
      >
        EXP
      </label>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={decrement}
          aria-label="Decrease EXP by 10"
          className="w-10 h-10 text-lg"
        >
          -
        </Button>
        <input
          id="pokemon-exp"
          type="number"
          min={0}
          max={999}
          value={exp}
          onChange={handleChange}
          className="w-20 px-3 py-2.5 border border-border-medium rounded-radius-md text-center text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={increment}
          aria-label="Increase EXP by 10"
          className="w-10 h-10 text-lg"
        >
          +
        </Button>
      </div>
    </div>
  );
}
