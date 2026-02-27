'use client';

import { useState, useCallback } from 'react';
import type { CustomTheme, CustomThemeFieldDef } from '@/types/custom-theme';
import { CustomThemePreview } from '@/components/admin/CustomThemePreview';

interface CustomThemeFormProps {
  initialTheme?: CustomTheme;
  onSave: (theme: CustomTheme) => void;
  onCancel: () => void;
}

const FONT_OPTIONS = [
  'Nanum Myeongjo',
  'Nanum Gothic',
  'Pretendard',
  'Inter',
  'Figtree',
  'Anonymous Pro',
];

const BORDER_STYLE_OPTIONS: { value: CustomTheme['borderStyle']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'double', label: 'Double' },
];

const BASE_TEMPLATE_OPTIONS: { value: CustomTheme['baseTemplate']; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'nametag', label: 'Nametag' },
];

/**
 * Generate a slug from a Korean/mixed name.
 * Removes Korean characters, lowercases, replaces spaces/special chars with hyphens.
 */
function generateSlug(name: string): string {
  return name
    .replace(/[\uAC00-\uD7AF\u3131-\u3163\u314F-\u3163]/g, '') // Remove Korean
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'custom-theme';
}

const DEFAULT_FORM_VALUES = {
  name: '',
  slug: '',
  baseTemplate: 'classic' as CustomTheme['baseTemplate'],
  frontBgColor: '#020912',
  frontTextColor: '#fcfcfc',
  frontBorderColor: '#020912',
  backBgColor: '#fcfcfc',
  backTextColor: '#020912',
  backBorderColor: '#020912',
  accentColor: '#020912',
  fontFamily: 'Nanum Myeongjo',
  borderStyle: 'none' as CustomTheme['borderStyle'],
  borderWidth: 0,
  customFields: [] as CustomThemeFieldDef[],
  isActive: true,
};

/**
 * Form for creating or editing a custom theme.
 * 2-column layout: left = form inputs, right = live preview.
 */
export function CustomThemeForm({ initialTheme, onSave, onCancel }: CustomThemeFormProps) {
  const isEdit = !!initialTheme;

  const [name, setName] = useState(initialTheme?.name ?? DEFAULT_FORM_VALUES.name);
  const [slug, setSlug] = useState(initialTheme?.slug ?? DEFAULT_FORM_VALUES.slug);
  const [slugManual, setSlugManual] = useState(isEdit);
  const [baseTemplate, setBaseTemplate] = useState<CustomTheme['baseTemplate']>(
    initialTheme?.baseTemplate ?? DEFAULT_FORM_VALUES.baseTemplate
  );
  const [frontBgColor, setFrontBgColor] = useState(initialTheme?.frontBgColor ?? DEFAULT_FORM_VALUES.frontBgColor);
  const [frontTextColor, setFrontTextColor] = useState(initialTheme?.frontTextColor ?? DEFAULT_FORM_VALUES.frontTextColor);
  const [frontBorderColor, setFrontBorderColor] = useState(initialTheme?.frontBorderColor ?? DEFAULT_FORM_VALUES.frontBorderColor);
  const [backBgColor, setBackBgColor] = useState(initialTheme?.backBgColor ?? DEFAULT_FORM_VALUES.backBgColor);
  const [backTextColor, setBackTextColor] = useState(initialTheme?.backTextColor ?? DEFAULT_FORM_VALUES.backTextColor);
  const [backBorderColor, setBackBorderColor] = useState(initialTheme?.backBorderColor ?? DEFAULT_FORM_VALUES.backBorderColor);
  const [accentColor, setAccentColor] = useState(initialTheme?.accentColor ?? DEFAULT_FORM_VALUES.accentColor);
  const [fontFamily, setFontFamily] = useState(initialTheme?.fontFamily ?? DEFAULT_FORM_VALUES.fontFamily);
  const [borderStyle, setBorderStyle] = useState<CustomTheme['borderStyle']>(
    initialTheme?.borderStyle ?? DEFAULT_FORM_VALUES.borderStyle
  );
  const [borderWidth, setBorderWidth] = useState(initialTheme?.borderWidth ?? DEFAULT_FORM_VALUES.borderWidth);
  const [customFields, setCustomFields] = useState<CustomThemeFieldDef[]>(
    initialTheme?.customFields ?? DEFAULT_FORM_VALUES.customFields
  );
  const [isActive, setIsActive] = useState(initialTheme?.isActive ?? DEFAULT_FORM_VALUES.isActive);
  const [errors, setErrors] = useState<string[]>([]);

  const handleNameChange = useCallback(
    (val: string) => {
      setName(val);
      if (!slugManual) {
        setSlug(generateSlug(val));
      }
    },
    [slugManual]
  );

  const handleSlugChange = useCallback((val: string) => {
    setSlugManual(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }, []);

  // Custom fields CRUD
  const addCustomField = useCallback(() => {
    setCustomFields((prev) => [
      ...prev,
      { key: '', label: '', type: 'text' },
    ]);
  }, []);

  const updateCustomField = useCallback(
    (index: number, updates: Partial<CustomThemeFieldDef>) => {
      setCustomFields((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const removeCustomField = useCallback((index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Validation
  const validate = (): string[] => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Theme name is required');
    if (!slug || slug.length < 2) errs.push('Slug must be at least 2 characters');
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/.test(slug)) {
      errs.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
    const builtins = ['classic', 'pokemon', 'hearthstone', 'harrypotter', 'tarot', 'nametag'];
    if (builtins.includes(slug)) {
      errs.push('Slug cannot match a built-in theme name');
    }
    for (let i = 0; i < customFields.length; i++) {
      const f = customFields[i];
      if (!f.key.trim()) errs.push(`Custom field #${i + 1}: key is required`);
      if (!f.label.trim()) errs.push(`Custom field #${i + 1}: label is required`);
    }
    return errs;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    const themeData: CustomTheme = {
      id: initialTheme?.id ?? '',
      slug,
      name: name.trim(),
      baseTemplate,
      isActive,
      sortOrder: initialTheme?.sortOrder ?? 0,
      frontBgColor,
      frontTextColor,
      frontBorderColor,
      backBgColor,
      backTextColor,
      backBorderColor,
      accentColor,
      fontFamily,
      borderStyle,
      borderWidth,
      customFields: customFields.filter((f) => f.key.trim() && f.label.trim()),
      createdAt: initialTheme?.createdAt ?? '',
      updatedAt: initialTheme?.updatedAt ?? '',
    };
    onSave(themeData);
  };

  // Build partial theme for live preview
  const previewTheme: Partial<CustomTheme> = {
    name: name || undefined,
    baseTemplate,
    frontBgColor,
    frontTextColor,
    frontBorderColor,
    backBgColor,
    backTextColor,
    backBorderColor,
    accentColor,
    fontFamily,
    borderStyle,
    borderWidth,
  };

  const inputClass =
    'w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]';
  const labelClass = 'block text-xs font-medium text-[#020912]/70 mb-1';
  const colorInputClass =
    'w-10 h-10 p-0 border border-gray-300 cursor-pointer bg-transparent';

  return (
    <div className="border border-[rgba(2,9,18,0.15)] bg-white p-6">
      <h3 className="text-base font-semibold text-[#020912] mb-4">
        {isEdit ? '커스텀 테마 수정' : '새 커스텀 테마 만들기'}
      </h3>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Form inputs */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="ct-name" className={labelClass}>
              테마 이름
            </label>
            <input
              id="ct-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="예: 크리스마스 에디션"
              className={inputClass}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="ct-slug" className={labelClass}>
              슬러그 (영문)
            </label>
            <input
              id="ct-slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="예: christmas-edition"
              className={inputClass}
            />
            <p className="text-[10px] text-[#020912]/40 mt-1">
              영문 소문자, 숫자, 하이픈만 사용 가능
            </p>
          </div>

          {/* Base template */}
          <div>
            <p className={labelClass}>베이스 템플릿</p>
            <div className="flex gap-3">
              {BASE_TEMPLATE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="baseTemplate"
                    value={opt.value}
                    checked={baseTemplate === opt.value}
                    onChange={() => setBaseTemplate(opt.value)}
                    className="accent-[#020912]"
                  />
                  <span className="text-sm text-[#020912]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[#020912] w-4 h-4"
              />
              <span className="text-sm text-[#020912]">활성화</span>
            </label>
          </div>

          {/* Front colors */}
          <fieldset className="border border-gray-200 p-3">
            <legend className="text-xs font-semibold text-[#020912]/70 px-1">
              앞면 색상
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ct-front-bg" className={labelClass}>배경</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ct-front-bg"
                    type="color"
                    value={frontBgColor}
                    onChange={(e) => setFrontBgColor(e.target.value)}
                    className={colorInputClass}
                  />
                  <span className="text-[10px] text-[#020912]/50">{frontBgColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="ct-front-text" className={labelClass}>텍스트</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ct-front-text"
                    type="color"
                    value={frontTextColor}
                    onChange={(e) => setFrontTextColor(e.target.value)}
                    className={colorInputClass}
                  />
                  <span className="text-[10px] text-[#020912]/50">{frontTextColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="ct-front-border" className={labelClass}>테두리</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ct-front-border"
                    type="color"
                    value={frontBorderColor}
                    onChange={(e) => setFrontBorderColor(e.target.value)}
                    className={colorInputClass}
                  />
                  <span className="text-[10px] text-[#020912]/50">{frontBorderColor}</span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Back colors */}
          <fieldset className="border border-gray-200 p-3">
            <legend className="text-xs font-semibold text-[#020912]/70 px-1">
              뒷면 색상
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ct-back-bg" className={labelClass}>배경</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ct-back-bg"
                    type="color"
                    value={backBgColor}
                    onChange={(e) => setBackBgColor(e.target.value)}
                    className={colorInputClass}
                  />
                  <span className="text-[10px] text-[#020912]/50">{backBgColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="ct-back-text" className={labelClass}>텍스트</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ct-back-text"
                    type="color"
                    value={backTextColor}
                    onChange={(e) => setBackTextColor(e.target.value)}
                    className={colorInputClass}
                  />
                  <span className="text-[10px] text-[#020912]/50">{backTextColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="ct-back-border" className={labelClass}>테두리</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ct-back-border"
                    type="color"
                    value={backBorderColor}
                    onChange={(e) => setBackBorderColor(e.target.value)}
                    className={colorInputClass}
                  />
                  <span className="text-[10px] text-[#020912]/50">{backBorderColor}</span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Accent color */}
          <div>
            <label htmlFor="ct-accent" className={labelClass}>강조 색상</label>
            <div className="flex items-center gap-2">
              <input
                id="ct-accent"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className={colorInputClass}
              />
              <span className="text-xs text-[#020912]/50">{accentColor}</span>
            </div>
          </div>

          {/* Font family */}
          <div>
            <label htmlFor="ct-font" className={labelClass}>폰트</label>
            <select
              id="ct-font"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className={inputClass}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          {/* Border style + width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ct-border-style" className={labelClass}>테두리 스타일</label>
              <select
                id="ct-border-style"
                value={borderStyle}
                onChange={(e) => setBorderStyle(e.target.value as CustomTheme['borderStyle'])}
                className={inputClass}
              >
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ct-border-width" className={labelClass}>테두리 두께 (0-12)</label>
              <input
                id="ct-border-width"
                type="number"
                min={0}
                max={12}
                value={borderWidth}
                onChange={(e) => setBorderWidth(Math.min(12, Math.max(0, Number(e.target.value))))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Custom fields */}
          <fieldset className="border border-gray-200 p-3">
            <legend className="text-xs font-semibold text-[#020912]/70 px-1">
              커스텀 필드
            </legend>
            <div className="space-y-3">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-100">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`cf-key-${idx}`} className="text-[10px] text-[#020912]/50">Key</label>
                      <input
                        id={`cf-key-${idx}`}
                        type="text"
                        value={field.key}
                        onChange={(e) => updateCustomField(idx, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                        placeholder="field_key"
                        className="w-full border border-gray-200 px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`cf-label-${idx}`} className="text-[10px] text-[#020912]/50">Label</label>
                      <input
                        id={`cf-label-${idx}`}
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(idx, { label: e.target.value })}
                        placeholder="Field Label"
                        className="w-full border border-gray-200 px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`cf-type-${idx}`} className="text-[10px] text-[#020912]/50">Type</label>
                      <select
                        id={`cf-type-${idx}`}
                        value={field.type}
                        onChange={(e) => updateCustomField(idx, { type: e.target.value as 'text' | 'number' })}
                        className="w-full border border-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomField(idx)}
                    className="mt-4 min-w-[32px] min-h-[32px] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    aria-label={`Remove custom field ${field.label || idx + 1}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCustomField}
                className="min-h-[36px] px-3 text-xs font-medium text-[#020912]/60 border border-dashed border-gray-300 hover:border-[#020912]/30 hover:bg-gray-50 transition-colors w-full"
              >
                + 필드 추가
              </button>
            </div>
          </fieldset>
        </div>

        {/* Right column: Live preview */}
        <div className="lg:sticky lg:top-4 self-start">
          <p className="text-xs font-semibold text-[#020912]/70 mb-2">미리보기</p>
          <div className="max-w-[240px]">
            <CustomThemePreview theme={previewTheme} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-5 text-sm font-medium text-[#020912]/70 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="min-h-[44px] px-5 text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/80 transition-colors"
        >
          {isEdit ? '저장' : '생성'}
        </button>
      </div>
    </div>
  );
}
