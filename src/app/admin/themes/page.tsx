'use client';

import { useState, useEffect, useCallback } from 'react';
import { POKEMON_TYPES } from '@/components/card/pokemon-types';
import { HEARTHSTONE_CLASSES } from '@/components/card/hearthstone-types';
import { HARRYPOTTER_HOUSES } from '@/components/card/harrypotter-types';
import { TAROT_ARCANAS } from '@/components/card/tarot-types';
import { ThemeListBox } from '@/components/admin/ThemeListBox';
import { ThemePreviewPanel } from '@/components/admin/ThemePreviewPanel';
import { ThemeEditPanel, DEFAULT_EDIT_STATE } from '@/components/admin/ThemeEditPanel';
import type { ThemeEditState } from '@/components/admin/ThemeEditPanel';
import { ThemeMobileSelector } from '@/components/admin/ThemeMobileSelector';
import { CustomThemeManager } from '@/components/admin/CustomThemeManager';
import type { CardData, CardTheme, PokemonType, HearthstoneClass, HarrypotterHouse, TarotArcana } from '@/types/card';

// Sample card data for theme previews
const sampleClassicCard: CardData = {
  front: {
    displayName: '\ud64d\uae38\ub3d9',
    avatarImage: null,
    backgroundColor: '#1a1a2e',
    textColor: '#FFFFFF',
  },
  back: {
    fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
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

function createSamplePokemonCard(pokemonType: PokemonType, exp: number = 100): CardData {
  return {
    front: {
      displayName: '\ud64d\uae38\ub3d9',
      avatarImage: null,
      backgroundColor: '#808080',
      textColor: '#FFFFFF',
    },
    back: {
      fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
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
    pokemonMeta: { type: pokemonType, exp },
  };
}

function createSampleHearthstoneCard(classType: HearthstoneClass, mana: number = 3, attack: number = 4, health: number = 5): CardData {
  return {
    front: {
      displayName: '\ud64d\uae38\ub3d9',
      avatarImage: null,
      backgroundColor: '#3D2B1F',
      textColor: '#FFFFFF',
    },
    back: {
      fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
      title: 'Software Developer',
      hashtags: ['#Development', '#Innovation', '#Technology'],
      socialLinks: [
        { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
        { platform: 'linkedin', url: 'linkedin.com/in/hong', label: 'hong' },
      ],
      backgroundColor: '#2A1F14',
      textColor: '#D4A76A',
    },
    theme: 'hearthstone',
    hearthstoneMeta: { classType, mana, attack, health },
  };
}

function createSampleHarrypotterCard(house: HarrypotterHouse, year: number = 1, spellPower: number = 100): CardData {
  return {
    front: {
      displayName: '\ud64d\uae38\ub3d9',
      avatarImage: null,
      backgroundColor: '#1A1A2E',
      textColor: '#FFFFFF',
    },
    back: {
      fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
      title: 'Software Developer',
      hashtags: ['#Development', '#Innovation', '#Technology'],
      socialLinks: [
        { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
        { platform: 'linkedin', url: 'linkedin.com/in/hong', label: 'hong' },
      ],
      backgroundColor: '#0E1A40',
      textColor: '#D4A76A',
    },
    theme: 'harrypotter',
    harrypotterMeta: { house, year, spellPower },
  };
}

function createSampleTarotCard(arcana: TarotArcana, cardNumber: number = 0, mystique: number = 100): CardData {
  return {
    front: {
      displayName: '\ud64d\uae38\ub3d9',
      avatarImage: null,
      backgroundColor: '#0D0B1A',
      textColor: '#FFFFFF',
    },
    back: {
      fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
      title: 'Software Developer',
      hashtags: ['#Development', '#Innovation', '#Technology'],
      socialLinks: [
        { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
        { platform: 'linkedin', url: 'linkedin.com/in/hong', label: 'hong' },
      ],
      backgroundColor: '#0D0B1A',
      textColor: '#FFD700',
    },
    theme: 'tarot',
    tarotMeta: { arcana, cardNumber, mystique },
  };
}

function createSampleNametagCard(): CardData {
  return {
    front: {
      displayName: '\ud64d\uae38\ub3d9',
      avatarImage: null,
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
    },
    back: {
      fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
      title: 'Software Developer',
      hashtags: ['#Development', '#Innovation', '#Technology'],
      socialLinks: [
        { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
        { platform: 'linkedin', url: 'linkedin.com/in/hong', label: 'hong' },
      ],
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
    },
    theme: 'nametag',
  };
}

function createSampleSNSProfileCard(): CardData {
  return {
    front: {
      displayName: '\ud64d\uae38\ub3d9',
      avatarImage: null,
      backgroundColor: '#4A90D9',
      textColor: '#FFFFFF',
    },
    back: {
      fullName: '\ud64d\uae38\ub3d9 | Hong Gildong',
      title: 'Software Developer',
      hashtags: ['#Development', '#Innovation', '#Technology'],
      socialLinks: [
        { platform: 'email', url: 'hong@example.com', label: 'hong@example.com' },
        { platform: 'instagram', url: 'instagram.com/hong', label: 'hong' },
      ],
      backgroundColor: '#4A90D9',
      textColor: '#FFFFFF',
    },
    theme: 'snsprofile',
  };
}

// Unified sample card creation from theme + edit state
function createSampleCard(theme: CardTheme, editState: ThemeEditState): CardData {
  switch (theme) {
    case 'pokemon':
      return createSamplePokemonCard(editState.pokemon.type, editState.pokemon.exp);
    case 'hearthstone':
      return createSampleHearthstoneCard(
        editState.hearthstone.classType,
        editState.hearthstone.mana,
        editState.hearthstone.attack,
        editState.hearthstone.health,
      );
    case 'harrypotter':
      return createSampleHarrypotterCard(
        editState.harrypotter.house,
        editState.harrypotter.year,
        editState.harrypotter.spellPower,
      );
    case 'tarot':
      return createSampleTarotCard(
        editState.tarot.arcana,
        editState.tarot.cardNumber,
        editState.tarot.mystique,
      );
    case 'nametag':
      return createSampleNametagCard();
    case 'snsprofile':
      return createSampleSNSProfileCard();
    case 'classic':
    default:
      return sampleClassicCard;
  }
}

interface ThemeStats {
  theme: string;
  count: number;
}

export default function ThemesPage() {
  // Section A (NEW): Theme selection + preview + edit
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('classic');
  const [themeEditState, setThemeEditState] = useState<ThemeEditState>(DEFAULT_EDIT_STATE);

  // Stats (used by ThemeListBox badges and Section C)
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

  // Hearthstone bulk apply options
  const [hearthstoneClass, setHearthstoneClass] = useState<HearthstoneClass>('mage');
  const [hearthstoneMana, setHearthstoneMana] = useState(3);
  const [hearthstoneAttack, setHearthstoneAttack] = useState(1);
  const [hearthstoneHealth, setHearthstoneHealth] = useState(5);

  // Harry Potter bulk apply options
  const [harrypotterHouse, setHarrypotterHouse] = useState<HarrypotterHouse>('gryffindor');
  const [harrypotterYear, setHarrypotterYear] = useState(1);
  const [harrypotterSpellPower, setHarrypotterSpellPower] = useState(100);

  // Tarot bulk apply options
  const [tarotArcana, setTarotArcana] = useState<TarotArcana>('major');
  const [tarotCardNumber, setTarotCardNumber] = useState(0);
  const [tarotMystique, setTarotMystique] = useState(100);

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
      } else if (targetTheme === 'hearthstone') {
        body.hearthstoneMeta = { classType: hearthstoneClass, mana: hearthstoneMana, attack: hearthstoneAttack, health: hearthstoneHealth };
      } else if (targetTheme === 'harrypotter') {
        body.harrypotterMeta = { house: harrypotterHouse, year: harrypotterYear, spellPower: harrypotterSpellPower };
      } else if (targetTheme === 'tarot') {
        body.tarotMeta = { arcana: tarotArcana, cardNumber: tarotCardNumber, mystique: tarotMystique };
      }

      const res = await fetch('/api/admin/themes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setResultMessage(`${data.updatedCount}\uac74\uc758 \uc758\ub8b0\uc5d0 \ud14c\ub9c8\uac00 \uc801\uc6a9\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`);
        fetchStats();
      } else {
        const data = await res.json();
        setResultMessage(`\uc624\ub958: ${data.error || '\ud14c\ub9c8 \uc801\uc6a9\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.'}`);
      }
    } catch {
      setResultMessage('\uc624\ub958: \uc11c\ubc84 \uc5f0\uacb0\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.');
    } finally {
      setApplying(false);
      setShowConfirm(false);
    }
  };

  const handleEditStateChange = (_theme: CardTheme, newEditState: ThemeEditState) => {
    setThemeEditState(newEditState);
  };

  // Build card data for the preview based on selected theme + edit state
  const previewCardData = createSampleCard(selectedTheme, themeEditState);

  const statusOptions = [
    { value: 'all', label: '\uc804\uccb4' },
    { value: 'submitted', label: '\uc81c\ucd9c\ub428' },
    { value: 'processing', label: '\ucc98\ub9ac\uc911' },
    { value: 'confirmed', label: '\ud655\uc778\ub428' },
    { value: 'revision_requested', label: '\uc218\uc815\uc694\uccad' },
    { value: 'delivered', label: '\uc804\ub2ec\uc644\ub8cc' },
    { value: 'rejected', label: '\uac70\uc808\ub428' },
    { value: 'cancelled', label: '\ucde8\uc18c\ub428' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#020912]">{'\ud14c\ub9c8 \uad00\ub9ac'}</h1>
        <p className="mt-1 text-sm text-[#020912]/50">
          {'\uba85\ud568 \ud14c\ub9c8\ub97c \ubbf8\ub9ac\ubcf4\uace0, \uc758\ub8b0\uc5d0 \uc77c\uad04 \uc801\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.'}
        </p>
      </div>

      {/* Section A (NEW): Theme List + Preview + Edit */}
      <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{'\ud14c\ub9c8 \ubbf8\ub9ac\ubcf4\uae30'}</h2>

        {/* Mobile: dropdown selector */}
        <div className="block lg:hidden mb-4">
          <ThemeMobileSelector
            selectedTheme={selectedTheme}
            onSelect={setSelectedTheme}
            stats={stats}
            statsLoading={statsLoading}
          />
        </div>

        {/* Desktop: 2-column layout */}
        <div className="flex gap-6">
          {/* Left: ThemeListBox (desktop only) */}
          <div className="hidden lg:block w-[280px] flex-shrink-0">
            <ThemeListBox
              selectedTheme={selectedTheme}
              onSelect={setSelectedTheme}
              stats={stats}
              statsLoading={statsLoading}
            />
          </div>

          {/* Right: Preview + Edit */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Preview panel */}
              <ThemePreviewPanel
                selectedTheme={selectedTheme}
                cardData={previewCardData}
              />

              {/* Edit panel */}
              <ThemeEditPanel
                selectedTheme={selectedTheme}
                editState={themeEditState}
                onChange={handleEditStateChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Custom Theme Management */}
      <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6 mb-6">
        <CustomThemeManager />
      </div>

      {/* Section C: Bulk Theme Apply */}
      <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{'\ud14c\ub9c8 \uc77c\uad04 \uc801\uc6a9'}</h2>

        <div className="space-y-4">
          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {'\uc0c1\ud0dc \ud544\ud130'}
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
                {'\ud604\uc7ac \ud14c\ub9c8 \ud544\ud130'}
              </label>
              <select
                id="current-theme-filter"
                value={currentThemeFilter}
                onChange={(e) => setCurrentThemeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
              >
                <option value="all">{'\uc804\uccb4'}</option>
                <option value="classic">Classic</option>
                <option value="pokemon">Pokemon</option>
                <option value="hearthstone">Hearthstone</option>
                <option value="harrypotter">Harry Potter</option>
                <option value="tarot">Tarot</option>
                <option value="nametag">Nametag</option>
                <option value="snsprofile">SNS Profile</option>
              </select>
            </div>
          </div>

          {/* Target Theme */}
          <div>
            <label htmlFor="target-theme" className="block text-sm font-medium text-gray-700 mb-1">
              {'\uc801\uc6a9\ud560 \ud14c\ub9c8'}
            </label>
            <select
              id="target-theme"
              value={targetTheme}
              onChange={(e) => setTargetTheme(e.target.value as CardTheme)}
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            >
              <option value="classic">Classic</option>
              <option value="pokemon">Pokemon</option>
              <option value="hearthstone">Hearthstone</option>
              <option value="harrypotter">Harry Potter</option>
              <option value="tarot">Tarot</option>
              <option value="nametag">Nametag</option>
              <option value="snsprofile">SNS Profile</option>
            </select>
          </div>

          {/* Pokemon Options (shown when target is pokemon) */}
          {targetTheme === 'pokemon' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <label htmlFor="pokemon-type" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\ud3ec\ucf13\ubaac \ud0c0\uc785'}
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

          {/* Hearthstone Options (shown when target is hearthstone) */}
          {targetTheme === 'hearthstone' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-300 rounded-lg">
              <div>
                <label htmlFor="hearthstone-class" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\uc9c1\uc5c5 (Class)'}
                </label>
                <select
                  id="hearthstone-class"
                  value={hearthstoneClass}
                  onChange={(e) => setHearthstoneClass(e.target.value as HearthstoneClass)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                >
                  {HEARTHSTONE_CLASSES.map((classConfig) => (
                    <option key={classConfig.id} value={classConfig.id}>
                      {classConfig.name} ({classConfig.label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hearthstone-mana" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\ub9c8\ub098 (0-10)'}
                </label>
                <input
                  id="hearthstone-mana"
                  type="number"
                  min={0}
                  max={10}
                  value={hearthstoneMana}
                  onChange={(e) => setHearthstoneMana(Math.min(10, Math.max(0, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>

              <div>
                <label htmlFor="hearthstone-attack" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\uacf5\uaca9\ub825 (0-12)'}
                </label>
                <input
                  id="hearthstone-attack"
                  type="number"
                  min={0}
                  max={12}
                  value={hearthstoneAttack}
                  onChange={(e) => setHearthstoneAttack(Math.min(12, Math.max(0, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>

              <div>
                <label htmlFor="hearthstone-health" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\uccb4\ub825 (1-12)'}
                </label>
                <input
                  id="hearthstone-health"
                  type="number"
                  min={1}
                  max={12}
                  value={hearthstoneHealth}
                  onChange={(e) => setHearthstoneHealth(Math.min(12, Math.max(1, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>
            </div>
          )}

          {/* Harry Potter Options (shown when target is harrypotter) */}
          {targetTheme === 'harrypotter' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div>
                <label htmlFor="harrypotter-house" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\uae30\uc219\uc0ac (House)'}
                </label>
                <select
                  id="harrypotter-house"
                  value={harrypotterHouse}
                  onChange={(e) => setHarrypotterHouse(e.target.value as HarrypotterHouse)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                >
                  {HARRYPOTTER_HOUSES.map((houseConfig) => (
                    <option key={houseConfig.id} value={houseConfig.id}>
                      {houseConfig.name} ({houseConfig.label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="harrypotter-year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year (1-7)
                </label>
                <input
                  id="harrypotter-year"
                  type="number"
                  min={1}
                  max={7}
                  value={harrypotterYear}
                  onChange={(e) => setHarrypotterYear(Math.min(7, Math.max(1, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>

              <div>
                <label htmlFor="harrypotter-spellpower" className="block text-sm font-medium text-gray-700 mb-1">
                  Spell Power (0-999)
                </label>
                <input
                  id="harrypotter-spellpower"
                  type="number"
                  min={0}
                  max={999}
                  value={harrypotterSpellPower}
                  onChange={(e) => setHarrypotterSpellPower(Math.min(999, Math.max(0, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>
            </div>
          )}

          {/* Tarot Options (shown when target is tarot) */}
          {targetTheme === 'tarot' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div>
                <label htmlFor="tarot-arcana" className="block text-sm font-medium text-gray-700 mb-1">
                  {'\uc544\ub974\uce74\ub098 (Arcana)'}
                </label>
                <select
                  id="tarot-arcana"
                  value={tarotArcana}
                  onChange={(e) => setTarotArcana(e.target.value as TarotArcana)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                >
                  {TAROT_ARCANAS.map((arcanaConfig) => (
                    <option key={arcanaConfig.id} value={arcanaConfig.id}>
                      {arcanaConfig.name} ({arcanaConfig.label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tarot-cardnumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number (0-21)
                </label>
                <input
                  id="tarot-cardnumber"
                  type="number"
                  min={0}
                  max={21}
                  value={tarotCardNumber}
                  onChange={(e) => setTarotCardNumber(Math.min(21, Math.max(0, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>

              <div>
                <label htmlFor="tarot-mystique" className="block text-sm font-medium text-gray-700 mb-1">
                  Mystique (0-999)
                </label>
                <input
                  id="tarot-mystique"
                  type="number"
                  min={0}
                  max={999}
                  value={tarotMystique}
                  onChange={(e) => setTarotMystique(Math.min(999, Math.max(0, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
                />
              </div>
            </div>
          )}

          {/* Affected Count & Apply Button */}
          <div className="flex items-center gap-4 pt-2">
            <div className="text-sm text-gray-600">
              {countLoading ? (
                <span className="text-gray-400">{'\uac74\uc218 \ud655\uc778 \uc911...'}</span>
              ) : affectedCount !== null ? (
                <>
                  {'\ub300\uc0c1 \uc758\ub8b0: '}<span className="font-semibold text-gray-900">{affectedCount}{'\uac74'}</span>
                  {statusFilter !== 'all' && (
                    <span className="text-xs text-gray-400 ml-1">{'(\uc0c1\ud0dc \ud544\ud130 \uc801\uc6a9\uc2dc \uc2e4\uc81c \uac74\uc218\uc640 \ub2e4\ub97c \uc218 \uc788\uc74c)'}</span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">{'\uac74\uc218\ub97c \ud655\uc778\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.'}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={applying || affectedCount === 0}
              className="min-h-[44px] px-6 bg-[#020912] text-white text-sm font-medium hover:bg-[#020912]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'\uc801\uc6a9'}
            </button>
          </div>

          {/* Result Message */}
          {resultMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                resultMessage.startsWith('\uc624\ub958')
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
              {'\ud14c\ub9c8 \uc77c\uad04 \uc801\uc6a9 \ud655\uc778'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {affectedCount !== null ? `${affectedCount}\uac74` : '\ud574\ub2f9'}{'\uc758 \uc758\ub8b0\uc5d0 '}
              <span className="font-semibold">
                {targetTheme === 'classic' ? 'Classic' : targetTheme === 'pokemon' ? 'Pokemon' : targetTheme === 'hearthstone' ? 'Hearthstone' : targetTheme === 'harrypotter' ? 'Harry Potter' : targetTheme === 'tarot' ? 'Tarot' : targetTheme === 'nametag' ? 'Nametag' : targetTheme === 'snsprofile' ? 'SNS Profile' : targetTheme}
              </span>{' '}
              {'\ud14c\ub9c8\ub97c \uc801\uc6a9\ud569\ub2c8\ub2e4.'}
              {targetTheme === 'pokemon' && (
                <>
                  <br />
                  {'\ud0c0\uc785: '}{POKEMON_TYPES.find((t) => t.id === pokemonType)?.name} / EXP: {pokemonExp}
                </>
              )}
              {targetTheme === 'hearthstone' && (
                <>
                  <br />
                  {'\uc9c1\uc5c5: '}{HEARTHSTONE_CLASSES.find((c) => c.id === hearthstoneClass)?.name} / {'\ub9c8\ub098: '}{hearthstoneMana} / {'\uacf5\uaca9: '}{hearthstoneAttack} / {'\uccb4\ub825: '}{hearthstoneHealth}
                </>
              )}
              {targetTheme === 'harrypotter' && (
                <>
                  <br />
                  {'\uae30\uc219\uc0ac: '}{HARRYPOTTER_HOUSES.find((h) => h.id === harrypotterHouse)?.name} / Year: {harrypotterYear} / Spell Power: {harrypotterSpellPower}
                </>
              )}
              {targetTheme === 'tarot' && (
                <>
                  <br />
                  {'\uc544\ub974\uce74\ub098: '}{TAROT_ARCANAS.find((a) => a.id === tarotArcana)?.name} / Card Number: {tarotCardNumber} / Mystique: {tarotMystique}
                </>
              )}
            </p>
            <p className="text-xs text-amber-600 mb-4">
              {'\uc774 \uc791\uc5c5\uc740 \ub418\ub3cc\ub9b4 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. \uacc4\uc18d\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={applying}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {'\ucde8\uc18c'}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="px-4 py-2 text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/80 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 disabled:opacity-50"
              >
                {applying ? '\uc801\uc6a9 \uc911...' : '\uc801\uc6a9'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
