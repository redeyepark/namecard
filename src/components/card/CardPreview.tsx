'use client';

import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';

export function CardPreview() {
  const activeSide = useCardStore((state) => state.activeSide);
  const [animKey, setAnimKey] = useState(0);
  const prevSide = useRef(activeSide);

  useEffect(() => {
    if (prevSide.current !== activeSide) {
      setAnimKey((k) => k + 1);
      prevSide.current = activeSide;
    }
  }, [activeSide]);

  return (
    <div className="w-full mx-auto">
      <div
        key={animKey}
        className="card-flip-enter"
      >
        <div style={activeSide === 'front' ? {} : { position: 'absolute', left: '-9999px' }}>
          <CardFront />
        </div>
        <div style={activeSide === 'back' ? {} : { position: 'absolute', left: '-9999px' }}>
          <CardBack />
        </div>
      </div>
    </div>
  );
}
