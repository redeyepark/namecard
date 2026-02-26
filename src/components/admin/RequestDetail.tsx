'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CardRequest } from '@/types/request';
import type { CardFrontData, CardBackData, CardTheme, PokemonType, PokemonMeta, HearthstoneClass, HearthstoneMeta, HarrypotterHouse, HarrypotterMeta } from '@/types/card';
import { POKEMON_TYPES } from '@/components/card/pokemon-types';
import { HEARTHSTONE_CLASSES } from '@/components/card/hearthstone-types';
import { HARRYPOTTER_HOUSES } from '@/components/card/harrypotter-types';
import { isTerminalStatus, requiresFeedback } from '@/types/request';
import { StatusBadge } from './StatusBadge';
import { CardCompare } from './CardCompare';
import { IllustrationUploader } from './IllustrationUploader';
import { StatusHistory } from './StatusHistory';
import { AdminCardPreview } from './AdminCardPreview';

interface RequestDetailProps {
  request: CardRequest;
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
  onUpdate: () => void;
}

type ActiveAction = 'reject' | 'revision_request' | null;

export function RequestDetail({
  request,
  originalAvatarUrl,
  illustrationUrl,
  onUpdate,
}: RequestDetailProps) {
  const [illustrationPreview, setIllustrationPreview] = useState<string | null>(null);
  const [illustrationUrlInput, setIllustrationUrlInput] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState<CardFrontData>(request.card.front);
  const [editBack, setEditBack] = useState<CardBackData>(request.card.back);
  const [editTheme, setEditTheme] = useState<CardTheme>(request.card.theme ?? 'classic');
  const [editPokemonMeta, setEditPokemonMeta] = useState<PokemonMeta>(
    request.card.pokemonMeta ?? { type: 'electric', exp: 100 }
  );
  const [editHearthstoneMeta, setEditHearthstoneMeta] = useState<HearthstoneMeta>(
    request.card.hearthstoneMeta ?? { classType: 'mage', mana: 3, attack: 1, health: 5 }
  );
  const [editHarrypotterMeta, setEditHarrypotterMeta] = useState<HarrypotterMeta>(
    request.card.harrypotterMeta ?? { house: 'gryffindor', year: 1, spellPower: 100 }
  );

  const { status } = request;
  const isTerminal = isTerminalStatus(status);
  const canRegister = status === 'submitted' && (illustrationPreview || illustrationUrl || illustrationUrlInput);
  const canConfirm = status === 'processing';
  const showIllustrationUploader = !isTerminal;

  // Find the latest admin feedback from status history
  const latestFeedbackEntry = [...request.statusHistory]
    .reverse()
    .find((entry) => entry.adminFeedback);

  const handleRegister = useCallback(async () => {
    if (!illustrationPreview && !illustrationUrl && !illustrationUrlInput) return;
    setActionLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { status: 'processing' };
      // URL takes precedence over file upload if both exist
      if (illustrationUrlInput) {
        body.illustrationUrl = illustrationUrlInput;
      } else if (illustrationPreview) {
        body.illustrationImage = illustrationPreview;
      }

      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '등록에 실패했습니다.');
      }

      setIllustrationPreview(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, illustrationPreview, illustrationUrl, illustrationUrlInput, onUpdate]);

  const handleConfirm = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '확정에 실패했습니다.');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '확정에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, onUpdate]);

  const handleReject = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          adminFeedback: feedbackText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '반려에 실패했습니다.');
      }

      setFeedbackText('');
      setActiveAction(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '반려에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, feedbackText, onUpdate]);

  const handleRevisionRequest = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'revision_requested',
          adminFeedback: feedbackText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '수정 요청에 실패했습니다.');
      }

      setFeedbackText('');
      setActiveAction(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 요청에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, feedbackText, onUpdate]);

  const handleDeliver = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '배송 완료 처리에 실패했습니다.');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '배송 완료 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, onUpdate]);

  const handleCancelAction = useCallback(() => {
    setActiveAction(null);
    setFeedbackText('');
  }, []);

  const handleSaveCardEdit = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardFront: {
            displayName: editFront.displayName,
            backgroundColor: editFront.backgroundColor,
            textColor: editFront.textColor,
          },
          cardBack: {
            fullName: editBack.fullName,
            title: editBack.title,
            hashtags: editBack.hashtags,
            socialLinks: editBack.socialLinks,
            backgroundColor: editBack.backgroundColor,
            textColor: editBack.textColor,
          },
          theme: editTheme,
          pokemonMeta: editTheme === 'pokemon' ? editPokemonMeta : null,
          hearthstoneMeta: editTheme === 'hearthstone' ? editHearthstoneMeta : null,
          harrypotterMeta: editTheme === 'harrypotter' ? editHarrypotterMeta : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '수정에 실패했습니다.');
      }
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, editFront, editBack, editTheme, editPokemonMeta, editHearthstoneMeta, editHarrypotterMeta, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditFront(request.card.front);
    setEditBack(request.card.back);
    setEditTheme(request.card.theme ?? 'classic');
    setEditPokemonMeta(request.card.pokemonMeta ?? { type: 'electric', exp: 100 });
    setEditHearthstoneMeta(request.card.hearthstoneMeta ?? { classType: 'mage', mana: 3, attack: 1, health: 5 });
    setEditHarrypotterMeta(request.card.harrypotterMeta ?? { house: 'gryffindor', year: 1, spellPower: 100 });
    setIsEditing(false);
  }, [request.card]);

  const handleSaveIllustration = useCallback(async () => {
    if (!illustrationPreview && !illustrationUrlInput) return;
    setActionLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (illustrationUrlInput) {
        body.illustrationUrl = illustrationUrlInput;
      } else if (illustrationPreview) {
        body.illustrationImage = illustrationPreview;
      }
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '일러스트 저장에 실패했습니다.');
      }
      setIllustrationPreview(null);
      setIllustrationUrlInput('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '일러스트 저장에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, illustrationPreview, illustrationUrlInput, onUpdate]);

  // Reset edit state when request prop changes
  useEffect(() => {
    setEditFront(request.card.front);
    setEditBack(request.card.back);
    setEditTheme(request.card.theme ?? 'classic');
    setEditPokemonMeta(request.card.pokemonMeta ?? { type: 'electric', exp: 100 });
    setEditHearthstoneMeta(request.card.hearthstoneMeta ?? { classType: 'mage', mana: 3, attack: 1, health: 5 });
    setEditHarrypotterMeta(request.card.harrypotterMeta ?? { house: 'gryffindor', year: 1, spellPower: 100 });
    setIsEditing(false);
  }, [request.card]);

  const submittedDate = new Date(request.submittedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDate = new Date(request.updatedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-[#020912]">
              {request.card.front.displayName}
            </h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs font-mono text-gray-400">{request.id}</p>
        </div>
      </div>

      {/* Status banners */}
      {status === 'confirmed' && (
        <div className="p-3 bg-[#dbe9e0]/50 border border-[#dbe9e0]">
          <p className="text-sm text-[#020912] font-medium">
            이 의뢰는 확정 완료되었습니다.
          </p>
        </div>
      )}
      {status === 'rejected' && (
        <div className="p-3 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">
            이 의뢰는 반려되었습니다.
          </p>
          {latestFeedbackEntry?.adminFeedback && (
            <p className="text-sm text-red-600 mt-1">
              사유: {latestFeedbackEntry.adminFeedback}
            </p>
          )}
        </div>
      )}
      {status === 'delivered' && (
        <div className="p-3 bg-[#e4f6ff]/50 border border-[#e4f6ff]">
          <p className="text-sm text-[#020912] font-medium">
            이 의뢰는 배송 완료되었습니다.
          </p>
        </div>
      )}
      {status === 'cancelled' && (
        <div className="p-3 bg-gray-50 border border-gray-200">
          <p className="text-sm text-[#020912]/60 font-medium">
            이 의뢰는 사용자에 의해 취소되었습니다.
          </p>
        </div>
      )}
      {status === 'revision_requested' && (
        <div className="p-3 bg-[#ffdfc8]/50 border border-[#ffdfc8]">
          <p className="text-sm text-[#020912] font-medium">
            사용자에게 수정을 요청한 상태입니다.
          </p>
          {latestFeedbackEntry?.adminFeedback && (
            <p className="text-sm text-[#020912]/70 mt-1">
              요청 내용: {latestFeedbackEntry.adminFeedback}
            </p>
          )}
        </div>
      )}

      {/* Card data */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">카드 정보</h2>
          {!isTerminal && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff] transition-colors"
            >
              수정
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-gray-500 text-xs block mb-1">표시 이름</label>
                <input
                  type="text"
                  value={editFront.displayName}
                  onChange={(e) => setEditFront({ ...editFront, displayName: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">전체 이름</label>
                <input
                  type="text"
                  value={editBack.fullName}
                  onChange={(e) => setEditBack({ ...editBack, fullName: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">직함</label>
                <input
                  type="text"
                  value={editBack.title}
                  onChange={(e) => setEditBack({ ...editBack, title: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">해시태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={editBack.hashtags.join(', ')}
                  onChange={(e) => setEditBack({ ...editBack, hashtags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">앞면 배경색</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editFront.backgroundColor}
                    onChange={(e) => setEditFront({ ...editFront, backgroundColor: e.target.value })}
                    className="w-8 h-8 border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editFront.backgroundColor}
                    onChange={(e) => setEditFront({ ...editFront, backgroundColor: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">뒷면 배경색</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editBack.backgroundColor}
                    onChange={(e) => setEditBack({ ...editBack, backgroundColor: e.target.value })}
                    className="w-8 h-8 border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editBack.backgroundColor}
                    onChange={(e) => setEditBack({ ...editBack, backgroundColor: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">앞면 텍스트 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editFront.textColor}
                    onChange={(e) => setEditFront({ ...editFront, textColor: e.target.value })}
                    className="w-8 h-8 border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editFront.textColor}
                    onChange={(e) => setEditFront({ ...editFront, textColor: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">뒷면 텍스트 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editBack.textColor}
                    onChange={(e) => setEditBack({ ...editBack, textColor: e.target.value })}
                    className="w-8 h-8 border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editBack.textColor}
                    onChange={(e) => setEditBack({ ...editBack, textColor: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  />
                </div>
              </div>
            </div>
            {/* Theme selector */}
            <div className="sm:col-span-2 pt-2 border-t border-gray-100">
              <label className="text-gray-500 text-xs block mb-2">테마</label>
              <div className="flex gap-2">
                {(['classic', 'pokemon', 'hearthstone', 'harrypotter'] as CardTheme[]).map((themeOption) => (
                  <button
                    key={themeOption}
                    type="button"
                    onClick={() => setEditTheme(themeOption)}
                    className={`px-4 py-2 text-sm font-medium border transition-colors ${
                      editTheme === themeOption
                        ? 'border-[#020912] bg-[#020912] text-[#fcfcfc]'
                        : 'border-[rgba(2,9,18,0.15)] bg-white text-[#020912] hover:bg-[#e4f6ff]'
                    }`}
                  >
                    {themeOption === 'classic' ? 'Classic' : themeOption === 'pokemon' ? 'Pokemon' : themeOption === 'hearthstone' ? 'Hearthstone' : 'Harry Potter'}
                  </button>
                ))}
              </div>
            </div>
            {/* Pokemon options (shown only when pokemon theme selected) */}
            {editTheme === 'pokemon' && (
              <>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Pokemon Type</label>
                  <select
                    value={editPokemonMeta.type}
                    onChange={(e) =>
                      setEditPokemonMeta({ ...editPokemonMeta, type: e.target.value as PokemonType })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  >
                    {POKEMON_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} - {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">EXP (0-999)</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={editPokemonMeta.exp}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditPokemonMeta({ ...editPokemonMeta, exp: Math.max(0, Math.min(999, val)) });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </>
            )}
            {/* Hearthstone options (shown only when hearthstone theme selected) */}
            {editTheme === 'hearthstone' && (
              <>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Hearthstone Class</label>
                  <select
                    value={editHearthstoneMeta.classType}
                    onChange={(e) =>
                      setEditHearthstoneMeta({ ...editHearthstoneMeta, classType: e.target.value as HearthstoneClass })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  >
                    {HEARTHSTONE_CLASSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Mana (0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editHearthstoneMeta.mana}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditHearthstoneMeta({ ...editHearthstoneMeta, mana: Math.max(0, Math.min(10, val)) });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Attack (0-12)</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={editHearthstoneMeta.attack}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditHearthstoneMeta({ ...editHearthstoneMeta, attack: Math.max(0, Math.min(12, val)) });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Health (1-12)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editHearthstoneMeta.health}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditHearthstoneMeta({ ...editHearthstoneMeta, health: Math.max(1, Math.min(12, val)) });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </>
            )}
            {/* Harry Potter options (shown only when harrypotter theme selected) */}
            {editTheme === 'harrypotter' && (
              <>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">House</label>
                  <select
                    value={editHarrypotterMeta.house}
                    onChange={(e) =>
                      setEditHarrypotterMeta({ ...editHarrypotterMeta, house: e.target.value as HarrypotterHouse })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                  >
                    {HARRYPOTTER_HOUSES.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} - {h.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Year (1-7)</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={editHarrypotterMeta.year}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditHarrypotterMeta({ ...editHarrypotterMeta, year: Math.max(1, Math.min(7, val)) });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Spell Power (0-999)</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={editHarrypotterMeta.spellPower}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditHarrypotterMeta({ ...editHarrypotterMeta, spellPower: Math.max(0, Math.min(999, val)) });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </>
            )}
            {/* Social links editing */}
            {editBack.socialLinks.length > 0 && (
              <div>
                <label className="text-gray-500 text-xs block mb-1">소셜 링크</label>
                <div className="space-y-2">
                  {editBack.socialLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-16">{link.platform}</span>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...editBack.socialLinks];
                          newLinks[i] = { ...newLinks[i], url: e.target.value };
                          setEditBack({ ...editBack, socialLinks: newLinks });
                        }}
                        className="flex-1 px-2 py-1.5 text-xs border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30"
                        placeholder="URL"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Save/Cancel buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveCardEdit}
                disabled={actionLoading}
                className="px-5 py-2 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {actionLoading ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={actionLoading}
                className="px-5 py-2 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff] transition-colors min-h-[44px] disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">표시 이름</span>
              <p className="font-medium text-gray-900">{request.card.front.displayName}</p>
            </div>
            <div>
              <span className="text-gray-500">전체 이름</span>
              <p className="font-medium text-gray-900">{request.card.back.fullName}</p>
            </div>
            <div>
              <span className="text-gray-500">직함</span>
              <p className="font-medium text-gray-900">{request.card.back.title || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">해시태그</span>
              <p className="font-medium text-gray-900">
                {request.card.back.hashtags.length > 0
                  ? request.card.back.hashtags.join(', ')
                  : '-'}
              </p>
            </div>
            {request.card.back.socialLinks.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">소셜 링크</span>
                <div className="mt-1 space-y-1">
                  {request.card.back.socialLinks.map((link, i) => (
                    <p key={i} className="text-gray-900 text-xs">
                      <span className="font-medium">{link.platform}</span>: {link.url}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">테마</span>
              <p className="font-medium text-gray-900">
                {(request.card.theme ?? 'classic') === 'classic' ? 'Classic' : request.card.theme === 'pokemon' ? 'Pokemon' : request.card.theme === 'hearthstone' ? 'Hearthstone' : 'Harry Potter'}
                {request.card.theme === 'pokemon' && request.card.pokemonMeta && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({POKEMON_TYPES.find(t => t.id === request.card.pokemonMeta?.type)?.name ?? request.card.pokemonMeta.type} / EXP {request.card.pokemonMeta.exp})
                  </span>
                )}
                {request.card.theme === 'hearthstone' && request.card.hearthstoneMeta && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({HEARTHSTONE_CLASSES.find(c => c.id === request.card.hearthstoneMeta?.classType)?.name ?? request.card.hearthstoneMeta.classType} / Mana {request.card.hearthstoneMeta.mana} / ATK {request.card.hearthstoneMeta.attack} / HP {request.card.hearthstoneMeta.health})
                  </span>
                )}
                {request.card.theme === 'harrypotter' && request.card.harrypotterMeta && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({HARRYPOTTER_HOUSES.find(h => h.id === request.card.harrypotterMeta?.house)?.name ?? request.card.harrypotterMeta.house} / Year {request.card.harrypotterMeta.year} / SP {request.card.harrypotterMeta.spellPower})
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500">앞면 배경색</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-5 h-5 rounded border border-gray-200"
                  style={{ backgroundColor: request.card.front.backgroundColor }}
                />
                <span className="text-xs font-mono text-gray-600">
                  {request.card.front.backgroundColor}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">뒷면 배경색</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-5 h-5 rounded border border-gray-200"
                  style={{ backgroundColor: request.card.back.backgroundColor }}
                />
                <span className="text-xs font-mono text-gray-600">
                  {request.card.back.backgroundColor}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">앞면 텍스트 색상</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-5 h-5 rounded border border-gray-200"
                  style={{ backgroundColor: request.card.front.textColor }}
                />
                <span className="text-xs font-mono text-gray-600">
                  {request.card.front.textColor}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">뒷면 텍스트 색상</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-5 h-5 rounded border border-gray-200"
                  style={{ backgroundColor: request.card.back.textColor }}
                />
                <span className="text-xs font-mono text-gray-600">
                  {request.card.back.textColor}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image comparison */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <h2 className="text-sm font-medium text-gray-700 mb-3">이미지 비교</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <CardCompare
              originalAvatarUrl={originalAvatarUrl}
              illustrationUrl={illustrationUrl}
              illustrationPreview={illustrationPreview || illustrationUrlInput || null}
            />
          </div>
          {showIllustrationUploader && (
            <div className="sm:w-[200px] shrink-0">
              <p className="text-xs font-medium text-gray-500 mb-2">일러스트 업로드</p>
              <IllustrationUploader
                currentImage={illustrationPreview}
                onImageSelect={setIllustrationPreview}
                onUrlInput={setIllustrationUrlInput}
                disabled={false}
              />
              {status !== 'submitted' && (illustrationPreview || illustrationUrlInput) && (
                <button
                  type="button"
                  onClick={handleSaveIllustration}
                  disabled={actionLoading}
                  className="mt-2 w-full px-3 py-2 text-xs font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[44px] disabled:opacity-50"
                >
                  {actionLoading ? '저장 중...' : '일러스트 저장'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card preview */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <h2 className="text-sm font-medium text-gray-700 mb-3">명함 미리보기</h2>
        <AdminCardPreview
          card={isEditing
            ? { front: editFront, back: editBack, theme: editTheme, pokemonMeta: editTheme === 'pokemon' ? editPokemonMeta : undefined, hearthstoneMeta: editTheme === 'hearthstone' ? editHearthstoneMeta : undefined, harrypotterMeta: editTheme === 'harrypotter' ? editHarrypotterMeta : undefined }
            : request.card
          }
          illustrationUrl={illustrationPreview || illustrationUrlInput || illustrationUrl}
        />
      </div>

      {/* User note */}
      {request.note && (
        <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
          <h2 className="text-sm font-medium text-gray-700 mb-2">사용자 메모</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.note}</p>
        </div>
      )}

      {/* Dates */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">제출일</span>
            <p className="text-gray-900">{submittedDate}</p>
          </div>
          <div>
            <span className="text-gray-500">최종 수정일</span>
            <p className="text-gray-900">{updatedDate}</p>
          </div>
        </div>
      </div>

      {/* Status history */}
      {request.statusHistory.length > 0 && (
        <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
          <StatusHistory history={request.statusHistory} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Feedback textarea (shown when activeAction is set) */}
      {activeAction && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {activeAction === 'reject' ? '반려 사유' : '수정 요청 내용'}
          </h3>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={
              activeAction === 'reject'
                ? '반려 사유를 입력해 주세요...'
                : '수정이 필요한 내용을 입력해 주세요...'
            }
            className="w-full min-h-[100px] p-3 text-sm border border-[rgba(2,9,18,0.15)] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent resize-y"
            disabled={actionLoading}
            aria-label={activeAction === 'reject' ? '반려 사유' : '수정 요청 내용'}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={activeAction === 'reject' ? handleReject : handleRevisionRequest}
              disabled={!feedbackText.trim() || actionLoading}
              className={`px-5 py-2 text-sm font-medium text-[#fcfcfc] transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${
                activeAction === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#020912] hover:bg-[#020912]/90'
              }`}
            >
              {actionLoading
                ? '처리 중...'
                : activeAction === 'reject'
                  ? '반려 확인'
                  : '수정 요청 확인'}
            </button>
            <button
              type="button"
              onClick={handleCancelAction}
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff] transition-colors min-h-[44px] disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isTerminal && status !== 'revision_requested' && !activeAction && (
        <div className="flex gap-3">
          {status === 'submitted' && (
            <>
              <button
                type="button"
                onClick={handleRegister}
                disabled={!canRegister || actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '처리 중...' : '등록'}
              </button>
              <button
                type="button"
                onClick={() => setActiveAction('reject')}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 hover:bg-red-50 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                반려
              </button>
            </>
          )}
          {canConfirm && (
            <>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '처리 중...' : '확정'}
              </button>
              <button
                type="button"
                onClick={() => setActiveAction('revision_request')}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#ffdfc8]/50 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                수정 요청
              </button>
            </>
          )}
          {status === 'confirmed' && (
            <button
              type="button"
              onClick={handleDeliver}
              disabled={actionLoading}
              className="px-6 py-2.5 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? '처리 중...' : '배송 완료'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
