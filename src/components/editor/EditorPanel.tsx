'use client';

import { useCardStore } from '@/stores/useCardStore';
import { FrontEditor } from './FrontEditor';
import { BackEditor } from './BackEditor';

export function EditorPanel() {
  const activeSide = useCardStore((state) => state.activeSide);

  return (
    <div
      className="space-y-4 tab-content-enter"
      key={activeSide}
      role="tabpanel"
      id={`panel-${activeSide}`}
      aria-labelledby={`tab-${activeSide}`}
    >
      {activeSide === 'front' ? <FrontEditor /> : <BackEditor />}
    </div>
  );
}
