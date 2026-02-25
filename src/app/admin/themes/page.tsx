'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import { POKEMON_TYPES } from '@/components/card/pokemon-types';
import type { CardData, CardTheme, PokemonType } from '@/types/card';

// Sample card data for theme previews
const sampleClassicCard: CardData = {
  front: {
    displayName: '홍길동',
    avatarImage: null,
    backgroundColor: '#1a1a2e',
    textColor: '#FFFFFF',
  },
  back: {
    fullName: '홍길동 | Hong Gildong',
    title: 'Software Developer',
    hashtags: ['#Development', '#Innovation', '#Technology'],
    socialLinks: [
      { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
      { platform: 'linkedin', url: 'linkedin.com/in/hong', label: 'hong' },
    ],
    backgroundColor: '#1a1a2e',
    textColor: '#FFFFFF',
  },
  theme: 'classic',
};

function createSamplePokemonCard(pokemonType: PokemonType): CardData {
  return {
    front: {
      displayName: '홍길동',
      avatarImage: null,
      backgroundColor: '#808080',
      textColor: '#FFFFFF',
    },
    back: {
      fullName: '홍길동 | Hong Gildong',
      title: 'Software Developer',
      hashtags: ['#Development', '#Innovation', '#Technology'],
      socialLinks: [
        { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
        { platform: 'linkedin', url: 'linkedin.com/in/hong', label: 'hong' },
      ],
      backgroundColor: '#1a1a2e',
      textColor: '#FFFFFF',
    },
    theme: 'pokemon',
    pokemonMeta: { type: pokemonType, exp: 100 },
  };
}

interface ThemeStats {
  theme: string;
  count: number;
}

export default function ThemesPage() {
  // Section B: Stats
  const [stats, setStats] = useState<ThemeStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Section C: Bulk Apply
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentThemeFilter, setCurrentThemeFilter] = useState('all');
  const [targetTheme, setTargetTheme] = useState<CardTheme>('classic');
  const [pokemonType, setPokemonType] = useState<PokemonType>('electric');
  const [pokemonExp, setPokemonExp] = useState(100);
  const [affectedCount, setAffectedCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Pokemon thumbnail selection
  const [selectedPokemonType, setSelectedPokemonType] = useState<PokemonType>('electric');

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/themes');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || []);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch affected count when filters change
  const fetchAffectedCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (currentThemeFilter !== 'all') params.set('theme', currentThemeFilter);

      // Use GET with filter params to count - we reuse GET stats but count from client
      const res = await fetch('/api/admin/themes');
      if (res.ok) {
        const data = await res.json();
        const allStats: ThemeStats[] = data.stats || [];

        let total = 0;
        if (currentThemeFilter === 'all') {
          total = allStats.reduce((sum: number, s: ThemeStats) => sum + s.count, 0);
        } else {
          const found = allStats.find((s: ThemeStats) => s.theme === currentThemeFilter);
          total = found ? found.count : 0;
        }
        // Note: status filter count is approximate since GET only returns theme-level stats
        // For exact count with status filter, we show approximate indicator
        setAffectedCount(total);
      }
    } catch {
      setAffectedCount(null);
    } finally {
      setCountLoading(false);
    }
  }, [statusFilter, currentThemeFilter]);

  useEffect(() => {
    fetchAffectedCount();
  }, [fetchAffectedCount]);

  const handleApply = async () => {
    setApplying(true);
    setResultMessage(null);
    try {
      const body: Record<string, unknown> = {
        targetTheme,
        filters: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          currentTheme: currentThemeFilter !== 'all' ? currentThemeFilter : undefined,
        },
      };

      if (targetTheme === 'pokemon') {
        body.pokemonMeta = { type: pokemonType, exp: pokemonExp };
      }

      const res = await fetch('/api/admin/themes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setResultMessage(`${data.updatedCount}건의 의뢰에 테마가 적용되었습니다.`);
        fetchStats();
      } else {
        const data = await res.json();
        setResultMessage(`오류: ${data.error || '테마 적용에 실패했습니다.'}`);
      }
    } catch {
      setResultMessage('오류: 서버 연결에 실패했습니다.');
    } finally {
      setApplying(false);
      setShowConfirm(false);
    }
  };

  const getStatCount = (theme: string): number => {
    const found = stats.find((s) => s.theme === theme);
    return found ? found.count : 0;
  };

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'submitted', label: '제출됨' },
    { value: 'processing', label: '처리중' },
    { value: 'confirmed', label: '확인됨' },
    { value: 'revision_requested', label: '수정요청' },
    { value: 'delivered', label: '전달완료' },
    { value: 'rejected', label: '거절됨' },
    { value: 'cancelled', label: '취소됨' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#020912]">테마 관리</h1>
        <p className="mt-1 text-sm text-[#020912]/50">
          명함 테마를 미리보고, 의뢰에 일괄 적용할 수 있습니다.
        </p>
      </div>

      {/* Section A: Theme Preview Gallery */}
      <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">테마 미리보기</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Classic Theme Preview */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-800">Classic</h3>
              <p className="text-sm text-gray-500 mt-1">
                기본 클래식 명함 디자인. 깔끔하고 심플한 레이아웃으로 전문적인 인상을 줍니다.
              </p>
            </div>
            <AdminCardPreview card={sampleClassicCard} illustrationUrl={null} />
          </div>

          {/* Pokemon Theme Preview */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-800">Pokemon</h3>
              <p className="text-sm text-gray-500 mt-1">
                포켓몬 트레이딩 카드 스타일. 골드 프레임, HP 배지 등 독특한 디자인 요소가 포함됩니다.
              </p>
            </div>
            <AdminCardPreview
              card={createSamplePokemonCard(selectedPokemonType)}
              illustrationUrl={null}
            />

            {/* Pokemon Type Thumbnails */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">타입 변형 (클릭하여 미리보기)</p>
              <div className="flex flex-wrap gap-2">
                {POKEMON_TYPES.map((typeConfig) => (
                  <button
                    key={typeConfig.id}
                    type="button"
                    onClick={() => setSelectedPokemonType(typeConfig.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedPokemonType === typeConfig.id
                        ? 'ring-2 ring-offset-1 ring-gray-900 bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-pressed={selectedPokemonType === typeConfig.id}
                    aria-label={`${typeConfig.name} (${typeConfig.label}) type preview`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox={typeConfig.iconData.viewBox}
                      className="w-3.5 h-3.5"
                      style={{ fill: selectedPokemonType === typeConfig.id ? '#FFFFFF' : typeConfig.color }}
                      aria-hidden="true"
                    >
                      <path d={typeConfig.iconData.path} />
                    </svg>
                    {typeConfig.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Request Theme Statistics */}
      <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">테마별 의뢰 현황</h2>

        {statsLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            통계를 불러오는 중...
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Classic</p>
                <p className="text-2xl font-bold text-gray-900">{getStatCount('classic')}<span className="text-sm font-normal text-gray-500 ml-1">건</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Pokemon</p>
                <p className="text-2xl font-bold text-gray-900">{getStatCount('pokemon')}<span className="text-sm font-normal text-gray-500 ml-1">건</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-xs text-blue-600">전체</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.reduce((sum, s) => sum + s.count, 0)}
                  <span className="text-sm font-normal text-blue-600 ml-1">건</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section C: Bulk Theme Apply */}
      <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">테마 일괄 적용</h2>

        <div className="space-y-4">
          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                상태 필터
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="current-theme-filter" className="block text-sm font-medium text-gray-700 mb-1">
                현재 테마 필터
              </label>
              <select
                id="current-theme-filter"
                value={currentThemeFilter}
                onChange={(e) => setCurrentThemeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
              >
                <option value="all">전체</option>
                <option value="classic">Classic</option>
                <option value="pokemon">Pokemon</option>
              </select>
            </div>
          </div>

          {/* Target Theme */}
          <div>
            <label htmlFor="target-theme" className="block text-sm font-medium text-gray-700 mb-1">
              적용할 테마
            </label>
            <select
              id="target-theme"
              value={targetTheme}
              onChange={(e) => setTargetTheme(e.target.value as CardTheme)}
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            >
              <option value="classic">Classic</option>
              <option value="pokemon">Pokemon</option>
            </select>
          </div>

          {/* Pokemon Options (shown when target is pokemon) */}
          {targetTheme === 'pokemon' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <label htmlFor="pokemon-type" className="block text-sm font-medium text-gray-700 mb-1">
                  포켓몬 타입
                </label>
                <select
                  id="pokemon-type"
                  value={pokemonType}
                  onChange={(e) => setPokemonType(e.target.value as PokemonType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                >
                  {POKEMON_TYPES.map((typeConfig) => (
                    <option key={typeConfig.id} value={typeConfig.id}>
                      {typeConfig.name} ({typeConfig.label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pokemon-exp" className="block text-sm font-medium text-gray-700 mb-1">
                  EXP (0-999)
                </label>
                <input
                  id="pokemon-exp"
                  type="number"
                  min={0}
                  max={999}
                  value={pokemonExp}
                  onChange={(e) => setPokemonExp(Math.min(999, Math.max(0, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>
            </div>
          )}

          {/* Affected Count & Apply Button */}
          <div className="flex items-center gap-4 pt-2">
            <div className="text-sm text-gray-600">
              {countLoading ? (
                <span className="text-gray-400">건수 확인 중...</span>
              ) : affectedCount !== null ? (
                <>
                  대상 의뢰: <span className="font-semibold text-gray-900">{affectedCount}건</span>
                  {statusFilter !== 'all' && (
                    <span className="text-xs text-gray-400 ml-1">(상태 필터 적용시 실제 건수와 다를 수 있음)</span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">건수를 확인할 수 없습니다.</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={applying || affectedCount === 0}
              className="min-h-[44px] px-6 bg-[#020912] text-white text-sm font-medium hover:bg-[#020912]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              적용
            </button>
          </div>

          {/* Result Message */}
          {resultMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                resultMessage.startsWith('오류')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
              role="alert"
            >
              {resultMessage}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
              테마 일괄 적용 확인
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {affectedCount !== null ? `${affectedCount}건` : '해당'}의 의뢰에{' '}
              <span className="font-semibold">
                {targetTheme === 'classic' ? 'Classic' : 'Pokemon'}
              </span>{' '}
              테마를 적용합니다.
              {targetTheme === 'pokemon' && (
                <>
                  <br />
                  타입: {POKEMON_TYPES.find((t) => t.id === pokemonType)?.name} / EXP: {pokemonExp}
                </>
              )}
            </p>
            <p className="text-xs text-amber-600 mb-4">
              이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={applying}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="px-4 py-2 text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/80 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 disabled:opacity-50"
              >
                {applying ? '적용 중...' : '적용'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
