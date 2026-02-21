'use client';

import { useState } from 'react';
import { exportCardAsPng } from '@/lib/export';

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const frontEl = document.getElementById('card-front');
      const backEl = document.getElementById('card-back');
      if (frontEl) await exportCardAsPng(frontEl, 'namecard-front.png');
      if (backEl) await exportCardAsPng(backEl, 'namecard-back.png');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      aria-label={isExporting ? 'Exporting card images' : 'Download card as PNG images'}
      className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-wait transition-colors min-h-[44px]"
    >
      {isExporting ? 'Exporting...' : 'Download PNG'}
    </button>
  );
}
